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
const canvas = document.querySelector("canvas");
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
const frequencyArray = new Uint8Array(analyserNode.frequencyBinCount);

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
    // get the Frequency Domain data for this sample
    analyserNode.getByteFrequencyData(frequencyArray);
    frequencyArray.slice(0, SAMPLE_SIZE * (2 / 3));
    // draw the display if the audio is playing
    if (audioPlaying == true) {
      requestAnimFrame(drawFrequencyDomain);
    }
  };

  track.buffer = audioData;
  track.start(0);
  audioPlaying = true;
}

function drawFrequencyDomain() {
  const sum = frequencyArray.reduce(function(a, b) {
    return a + b;
  });
  const avg = sum / frequencyArray.length;

  clearFrequencyCanvas(avg / CANVAS_HEIGHT);
  frequencyCanvas.lineWidth = 2;
  const radius = 50;
  const center = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
  const pastValues = {
    x:
      center.x -
      (2 * radius) / 10 -
      (8 * ((2 * Math.PI * frequencyArray[0]) / CANVAS_HEIGHT) * radius) / 10,
    y: center.y,
    invertedX:
      center.x -
      (2 * radius) / 10 -
      (8 * ((2 * Math.PI * frequencyArray[0]) / CANVAS_HEIGHT) * radius) / 10,
    invertedY: center.y
  };

  for (var i = 1; i < (2 * frequencyArray.length) / 3; i++) {
    const value = frequencyArray[i] / CANVAS_HEIGHT;
    // const x = i / (frequencyArray.length / CANVAS_WIDTH) - 1;
    // const y = CANVAS_HEIGHT - CANVAS_HEIGHT * value;

    const alpha = (i / ((2 * frequencyArray.length) / 3)) * 2 * Math.PI;
    const beta = value * 2 * Math.PI;
    const adaptedRadius = (2 * radius) / 10 + (8 * beta * radius) / 10;

    const x = center.x - Math.cos(alpha / 2) * adaptedRadius;
    const y = center.y + Math.sin(alpha / 2) * adaptedRadius;
    // const hue = 360 * (x / frequencyArray.length);
    const hue = 360 * value;
    const saturation = Math.ceil(value * 100) / 2;
    // const light = 25 + (3 * Math.ceil(value * 100)) / 4;
    const light = 100 * (x / frequencyArray.length);

    frequencyCanvas.beginPath();
    // frequencyCanvas.arc(x, y, 4, 0, 2 * Math.PI, true); // Inner: CW

    frequencyCanvas.moveTo(pastValues.x, pastValues.y);
    frequencyCanvas.lineTo(x, y);
    frequencyCanvas.stroke();
    frequencyCanvas.beginPath();
    // frequencyCanvas.arc(x, y, 4, 0, 2 * Math.PI, true); // Inner: CW

    const invertedX = center.x - Math.cos(-alpha / 2) * adaptedRadius;
    const invertedY = center.y + Math.sin(-alpha / 2) * adaptedRadius;
    frequencyCanvas.moveTo(pastValues.invertedX, pastValues.invertedY);
    frequencyCanvas.lineTo(invertedX, invertedY);
    frequencyCanvas.stroke();
    frequencyCanvas.strokeStyle = `hsl(${hue},${saturation}%,${light}%)`;
    // frequencyCanvas.closePath();

    // frequencyCanvas.fillStyle = `hsl(${hue},${saturation}%,${light}%)`;
    // frequencyCanvas.fill();

    frequencyCanvas.lineWidth = adaptedRadius;

    pastValues.x = x;
    pastValues.y = y;
    pastValues.invertedX = invertedX;
    pastValues.invertedY = invertedY;
  }
}

function clearFrequencyCanvas(maxValue) {
  const hue = 360 * maxValue;
  const saturation = Math.ceil(maxValue * 100) / 2;
  canvas.style.backgroundColor = `hsl(${hue},${saturation}%,50%)`;
  frequencyCanvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}
