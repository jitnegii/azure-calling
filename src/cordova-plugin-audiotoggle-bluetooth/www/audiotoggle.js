exports.SPEAKER = "speaker";
exports.EARPIECE = "earpiece";
exports.NORMAL = "normal";
exports.RINGTONE = "ringtone";

exports.setAudioMode = function (mode) {
	console.log("Changing speaker")
  cordova.exec(
    (data) => {
      console.log("setAudioMode", data);
    },
    (err) => {
      console.log("setAudioMode", err);
    },
    "AudioTogglePlugin",
    "setAudioMode",
    [mode]
  );
};
