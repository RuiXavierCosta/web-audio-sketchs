window.AudioContext = (function() {
  return (
    window.webkitAudioContext || window.AudioContext || window.mozAudioContext
  );
})();

const context = new AudioContext();

const audioFile = document.getElementById("audio-file");
const track = context.createBufferSource();
track.connect(context.destination);

audioFile.addEventListener("change", e => {
  if (e.target.files && e.target.files.length > 0) {
    const f = e.target.files[0];

    const reader = new FileReader();
    reader.onload = function(e) {
      const data = e.target.result;

      context.decodeAudioData(data, function(resampledData) {
        track.buffer = resampledData;

        track.start();
      });
    };
    reader.readAsArrayBuffer(f);
  }
});
