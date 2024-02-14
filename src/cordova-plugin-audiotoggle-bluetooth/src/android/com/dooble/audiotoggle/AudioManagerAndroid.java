package com.dooble.audiotoggle;

import android.content.ContentResolver;
import android.content.Context;
import android.content.pm.PackageManager;
import android.database.ContentObserver;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.os.HandlerThread;
import android.util.Log;

class AudioManagerAndroid {
  private static final String TAG = "AudioTogglePlugin";
  // Set to true to enable debug logs. Avoid in production builds.
  // NOTE: always check in as false.
  private static final boolean DEBUG = true;
  /** Simple container for device information. */
  public static class AudioDeviceName {
    private final int mId;
    private final String mName;
    public AudioDeviceName(int id, String name) {
      mId = id;
      mName = name;
    }
    private String id() {
      return String.valueOf(mId);
    }
    private String name() {
      return mName;
    }
  }
  private final AudioManager mAudioManager;
  // Enabled during initialization if MODIFY_AUDIO_SETTINGS permission is
  // granted. Required to shift system-wide audio settings.
  private boolean mHasModifyAudioSettingsPermission;
  private boolean mIsInitialized;
  private boolean mSavedIsSpeakerphoneOn;
  private boolean mSavedIsMicrophoneMute;
  private AudioDeviceSelector mAudioDeviceSelector;
  /** Construction */



   AudioManagerAndroid(Context context) {
    ContextUtils.setContext(context);
    mAudioManager = (AudioManager) context.getApplicationContext().getSystemService(
      Context.AUDIO_SERVICE);
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      mAudioDeviceSelector = new AudioDeviceSelectorPreS(mAudioManager);
    } else {
      mAudioDeviceSelector = new AudioDeviceSelectorPostS(mAudioManager);
    }
    init();
  }
  /**
   * Saves the initial speakerphone and microphone state.
   * Populates the list of available audio devices and registers receivers for broadcasting
   * intents related to wired headset and Bluetooth devices and USB audio devices.
   */
  private void init() {
    if (DEBUG) logd("init");
    if (DEBUG) logDeviceInfo();
    if (mIsInitialized) return;
    // Check if process has MODIFY_AUDIO_SETTINGS and RECORD_AUDIO
    // permissions. Both are required for full functionality.
    mHasModifyAudioSettingsPermission =
      hasPermission(android.Manifest.permission.MODIFY_AUDIO_SETTINGS);
    if (DEBUG && !mHasModifyAudioSettingsPermission) {
      logd("MODIFY_AUDIO_SETTINGS permission is missing");
    }
    mAudioDeviceSelector.init();
    mIsInitialized = true;
  }
  /**
   * Unregister all previously registered intent receivers and restore
   * the stored state (stored in {@link #init()}).
   */
  private void close() {
    if (DEBUG) logd("close");
    if (!mIsInitialized) return;
    mAudioDeviceSelector.close();
    mIsInitialized = false;
  }
  /**
   * Sets audio mode as COMMUNICATION if input parameter is true.
   * Restores audio mode to NORMAL if input parameter is false.
   * Required permission: android.Manifest.permission.MODIFY_AUDIO_SETTINGS.
   */

   void setCommunicationAudioModeOn(boolean on) {
    if (DEBUG) logd("setCommunicationAudioModeOn(" + on + ")");
    if (!mIsInitialized) return;
    // The MODIFY_AUDIO_SETTINGS permission is required to allow an
    // application to modify global audio settings.
    if (!mHasModifyAudioSettingsPermission) {
      Log.w(TAG,
        "MODIFY_AUDIO_SETTINGS is missing => client will run "
          + "with reduced functionality");
      return;
    }
    // TODO(crbug.com/1317548): Should we exit early if we are already in/out of
    // communication mode?
    if (on) {
      // Store microphone mute state and speakerphone state so it can
      // be restored when closing.
      mSavedIsSpeakerphoneOn = mAudioDeviceSelector.isSpeakerphoneOn();
      mSavedIsMicrophoneMute = mAudioManager.isMicrophoneMute();
      mAudioDeviceSelector.setCommunicationAudioModeOn(true);
      // Start observing volume changes to detect when the
      // voice/communication stream volume is at its lowest level.
      // It is only possible to pull down the volume slider to about 20%
      // of the absolute minimum (slider at far left) in communication
      // mode but we want to be able to mute it completely.
    } else {
      mAudioDeviceSelector.setCommunicationAudioModeOn(false);
      // Restore previously stored audio states.
      setMicrophoneMute(mSavedIsMicrophoneMute);
      mAudioDeviceSelector.setSpeakerphoneOn(mSavedIsSpeakerphoneOn);
    }
    setCommunicationAudioModeOnInternal(on);
  }
  /**
   * Sets audio mode to MODE_IN_COMMUNICATION if input parameter is true.
   * Restores audio mode to MODE_NORMAL if input parameter is false.
   */
  private void setCommunicationAudioModeOnInternal(boolean on) {
    if (DEBUG) logd("setCommunicationAudioModeOn(" + on + ")");
    if (on) {
      try {
        mAudioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
      } catch (SecurityException e) {
        logDeviceInfo();
        throw e;
      }
    } else {
      // Restore the mode that was used before we switched to
      // communication mode.
      try {
        mAudioManager.setMode(AudioManager.MODE_NORMAL);
      } catch (SecurityException e) {
        logDeviceInfo();
        throw e;
      }
    }
  }
  /**
   * Activates, i.e., starts routing audio to, the specified audio device.
   *
   * @param deviceId Unique device ID (integer converted to string)
   * representing the selected device. This string is empty if the so-called
   * default device is requested.
   * Required permissions: android.Manifest.permission.MODIFY_AUDIO_SETTINGS
   * and android.Manifest.permission.RECORD_AUDIO.
   */

   boolean setDevice(String deviceId) {
    if (DEBUG) logd("setDevice: " + deviceId);
    if (!mIsInitialized) return false;
    boolean hasRecordAudioPermission = hasPermission(android.Manifest.permission.RECORD_AUDIO);
    if (!mHasModifyAudioSettingsPermission || !hasRecordAudioPermission) {
      Log.w(TAG,
        "Requires MODIFY_AUDIO_SETTINGS and RECORD_AUDIO. "
          + "Selected device will not be available for recording");
      return false;
    }
    return mAudioDeviceSelector.selectDevice(deviceId);
  }



  /** Sets the microphone mute state. */
  private void setMicrophoneMute(boolean on) {
    boolean wasMuted = mAudioManager.isMicrophoneMute();
    if (wasMuted == on) {
      return;
    }
    mAudioManager.setMicrophoneMute(on);
  }
  /** Gets  the current microphone mute state. */
  private boolean isMicrophoneMute() {
    return mAudioManager.isMicrophoneMute();
  }
  /** Checks if the process has as specified permission or not. */
  private boolean hasPermission(String permission) {
    return ContextUtils.getApplicationContext().checkSelfPermission(permission)
      == PackageManager.PERMISSION_GRANTED;
//    return true;
  }
  /** Information about the current build, taken from system properties. */
  private void logDeviceInfo() {
    logd("Android SDK: " + Build.VERSION.SDK_INT + ", "
      + "Release: " + Build.VERSION.RELEASE + ", "
      + "Brand: " + Build.BRAND + ", "
      + "Device: " + Build.DEVICE + ", "
      + "Id: " + Build.ID + ", "
      + "Hardware: " + Build.HARDWARE + ", "
      + "Manufacturer: " + Build.MANUFACTURER + ", "
      + "Model: " + Build.MODEL + ", "
      + "Product: " + Build.PRODUCT);
  }
  /** Trivial helper method for debug logging */
  static void logd(String msg) {
    Log.d(TAG, msg);
  }
  /** Trivial helper method for error logging */
  static void loge(String msg) {
    Log.e(TAG, msg);
  }



}
