window.AudioContext = (function() {
  return (
    window.webkitAudioContext || window.AudioContext || window.mozAudioContext
  );
})();
window.requestAnimFrame = (function() {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function(callback, element) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
})();

const context = new AudioContext();

const audioFile = document.getElementById("audio-file");
const audio = document.getElementById("audio");
const track = context.createMediaElementSource(audio);

// Audio File Setup

audioFile.addEventListener("change", e => {
  if (e.target.files && e.target.files.length > 0) {
    const f = e.target.files[0];

    const reader = new FileReader();
    reader.onload = (function(_audio, _track) {
      return function(e) {
        _audio.src = e.target.result;

        _track.connect(context.destination);
        audio.play();
      };
    })(audio, track);
    reader.readAsDataURL(f);
  }
});

// Gain Node Setup

const gainNode = context.createGain();

const volumeControl = document.querySelector('[data-action="volume"]');
volumeControl.addEventListener(
  "input",
  function() {
    gainNode.gain.value = this.value;
  },
  false
);

// Pan Node Setup

const pannerOptions = { pan: 0 };
const panner = new StereoPannerNode(context, pannerOptions);

const pannerControl = document.querySelector('[data-action="panner"]');
pannerControl.addEventListener(
  "input",
  function() {
    panner.pan.value = this.value;
  },
  false
);

track
  .connect(gainNode)
  .connect(panner)
  .connect(context.destination);
