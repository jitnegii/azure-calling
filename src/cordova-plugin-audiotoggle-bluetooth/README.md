## AudioToggle

This is a copy of https://github.com/alongubkin/audiotoggle forked from danielflippance/audiotoggle with some additions to enable a connected bluetooth headset's microphone in NORMAL and EARPICE modes on android

    cordova plugin add cordova-plugin-audiotoggle --save
    
### Supported Platforms

- Android
- iOS

### Usage

To set the current audio mode, use the `setAudioMode` method:

    AudioToggle.setAudioMode(AudioToggle.SPEAKER);
    // or
    AudioToggle.setAudioMode(AudioToggle.EARPIECE);

Android has the following additional options:

    AudioToggle.setAudioMode(AudioToggle.NORMAL);
    // and
    AudioToggle.setAudioMode(AudioToggle.RINGTONE);
