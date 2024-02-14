package com.dooble.audiotoggle;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.Context;
import android.util.Log;

public class AudioTogglePlugin extends CordovaPlugin {
  public static final String ACTION_SET_AUDIO_MODE = "setAudioMode";

  private static final String TAG = "AudioTogglePlugin";


  @Override
  public boolean execute(String action, JSONArray args,
                         CallbackContext callbackContext) throws JSONException {

    if (action.equals(ACTION_SET_AUDIO_MODE)) {
      logd("Action: " + action);
      logd("Args: " + args.toString());

      Context context = webView.getContext().getApplicationContext();
      boolean result = setDevice(context, args.getString(0));
      logd("result: " + result);
      if (result) {
        callbackContext.error("Successfully changed audio device");
      } else {
        callbackContext.error("Error while changing audio device");
      }
      return result;
    }
    callbackContext.error("Invalid action");
    return false;
  }

  private boolean setDevice(Context context, String type) {
    AudioManagerAndroid audioManager = new AudioManagerAndroid(context);
    int deviceId;
    if (type.equalsIgnoreCase("earpiece")) {
      deviceId = AudioDeviceSelector.Devices.ID_EARPIECE;
    } else {
      deviceId = AudioDeviceSelector.Devices.ID_SPEAKERPHONE;
    }
    audioManager.setCommunicationAudioModeOn(true);
    return audioManager.setDevice(String.valueOf(deviceId));
  }

  static void logd(String msg) {
    Log.d(TAG, msg);
  }

}
