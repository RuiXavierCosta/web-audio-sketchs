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

let audioPlaying = false;

const context = new AudioContext();
const audioFile = document.getElementById("audio-file");

const SAMPLE_SIZE = 1024;
const track = context.createBufferSource();
const analyserNode = context.createAnalyser();
const javascriptNode = context.createScriptProcessor(SAMPLE_SIZE, 1, 1);

// connect the nodes together
track.connect(context.destination);
track.connect(analyserNode);
analyserNode.connect(javascriptNode);
javascriptNode.connect(context.destination);

// Create the array for the data values
const amplitudeArray = new Uint8Array(analyserNode.frequencyBinCount);
const frequencyArray = new Uint8Array(analyserNode.frequencyBinCount);

const timeCanvas = document.getElementById("time-canvas").getContext("2d");
const frequencyCanvas = document
  .getElementById("frequency-canvas")
  .getContext("2d");
var CANVAS_WIDTH = 512;
var CANVAS_HEIGHT = 256;

// Audio File Setup

audioFile.addEventListener("change", e => {
  if (e.target.files && e.target.files.length > 0) {
    const f = e.target.files[0];

    const reader = new FileReader();
    reader.onload = function(e) {
      const data = e.target.result;

      context.decodeAudioData(data, function(resampledData) {
        startPlaying(resampledData);
      });
    };
    reader.readAsArrayBuffer(f);
  }
});

function startPlaying(audioData) {
  // setup the event handler that is triggered every time enough samples have been collected
  // trigger the audio analysis and draw the results
  javascriptNode.onaudioprocess = function() {
    // get the Time Domain data for this sample
    analyserNode.getByteTimeDomainData(amplitudeArray);
    // get the Frequency Domain data for this sample
    analyserNode.getByteFrequencyData(frequencyArray);

    // draw the display if the audio is playing
    if (audioPlaying == true) {
      requestAnimFrame(drawTimeDomain);
      requestAnimFrame(drawFrequencyDomain);
    }
  };

  track.buffer = audioData;
  track.start(0);
  audioPlaying = true;
}

function drawTimeDomain() {
  clearTimeCanvas();
  timeCanvas.beginPath();
  timeCanvas.moveTo(-1, CANVAS_HEIGHT);

  for (var i = 0; i < amplitudeArray.length; i++) {
    const value = amplitudeArray[i] / CANVAS_HEIGHT;
    const x = i / (frequencyArray.length / CANVAS_WIDTH) - 1;
    const y = CANVAS_HEIGHT - CANVAS_HEIGHT * value + 1;
    timeCanvas.strokeStyle = "#ffffff";
    timeCanvas.lineTo(x, y);
  }
  timeCanvas.lineWidth = 2;
  timeCanvas.stroke();
}

function drawFrequencyDomain() {
  clearFrequencyCanvas();
  frequencyCanvas.beginPath();
  frequencyCanvas.moveTo(-1, CANVAS_HEIGHT);

  for (var i = 0; i < frequencyArray.length; i++) {
    const value = frequencyArray[i] / CANVAS_HEIGHT;
    // const x = (CANVAS_WIDTH / frequencyArray.length) * i - 1;
    const x = i / (frequencyArray.length / CANVAS_WIDTH) - 1;
    const y = CANVAS_HEIGHT - CANVAS_HEIGHT * value + 1;
    frequencyCanvas.strokeStyle = "#ffffff";
    frequencyCanvas.lineTo(x, y);
  }
  frequencyCanvas.lineWidth = 2;
  frequencyCanvas.stroke();
}

function clearTimeCanvas() {
  timeCanvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function clearFrequencyCanvas() {
  frequencyCanvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}
