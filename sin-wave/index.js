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
let playing = false;
const REAL_TIME_FREQUENCY = 440;
const SAMPLE_SIZE = 44100 * 2;
const SAMPLE_RATE = 44100;
const ANGULAR_FREQUENCY = REAL_TIME_FREQUENCY * 2 * Math.PI;
const FREQ_SAMPLES = 256;
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 256;

const playButton = document.getElementById("play-sound");
const track = context.createBufferSource();
const analyserNode = context.createAnalyser();
const javascriptNode = context.createScriptProcessor(FREQ_SAMPLES, 1, 1);

track.connect(analyserNode);
analyserNode.connect(javascriptNode);
javascriptNode.connect(context.destination);

const buffer = context.createBuffer(1, SAMPLE_SIZE, SAMPLE_RATE);
const sinWave = buffer.getChannelData(0);

const amplitudeArray = new Uint8Array(analyserNode.frequencyBinCount);
const frequencyArray = new Uint8Array(analyserNode.frequencyBinCount);

const timeCanvas = document.getElementById("time-canvas").getContext("2d");
const frequencyCanvas = document
  .getElementById("frequency-canvas")
  .getContext("2d");

for (let sampleNumber = 0; sampleNumber < SAMPLE_SIZE; sampleNumber++) {
  sinWave[sampleNumber] = generateSample(sampleNumber);
}

function generateSample(sampleNumber) {
  const sampleTime = sampleNumber / SAMPLE_RATE;
  const sampleAngle = sampleTime * ANGULAR_FREQUENCY;
  return Math.sin(sampleAngle);
}

track.buffer = buffer;
track.connect(context.destination);

playButton.onclick = function() {
  track.start();

  javascriptNode.onaudioprocess = function() {
    // get the Time Domain data for this sample
    analyserNode.getByteTimeDomainData(amplitudeArray);
    // get the Frequency Domain data for this sample
    analyserNode.getByteFrequencyData(frequencyArray);

    requestAnimFrame(drawFrequencyDomain);
    requestAnimFrame(drawTimeDomain);
  };

  track.stop(context.currentTime + 1);
};

function drawTimeDomain() {
  clearTimeCanvas();
  timeCanvas.lineWidth = 2;
  const pastValues = { x: -1, y: CANVAS_HEIGHT };

  for (var i = 0; i < amplitudeArray.length; i++) {
    const value = amplitudeArray[i] / CANVAS_HEIGHT;
    const x = i - 1;
    const y = CANVAS_HEIGHT - CANVAS_HEIGHT * value + 1;
    let color = ((0xffffff / 2) * x).toString(16);
    color = x > 0 ? color : "#0xffffff";

    timeCanvas.beginPath();
    timeCanvas.moveTo(pastValues.x, pastValues.y);
    timeCanvas.strokeStyle = `#${color}`;
    timeCanvas.lineTo(x, y);
    timeCanvas.stroke();

    pastValues.x = x;
    pastValues.y = y;
  }
}

function drawFrequencyDomain() {
  clearFrequencyCanvas();
  frequencyCanvas.lineWidth = 2;
  const pastValues = { x: -1, y: CANVAS_HEIGHT };

  for (var i = 0; i < frequencyArray.length; i++) {
    const value = frequencyArray[i] / CANVAS_HEIGHT;
    const x = i - 1;
    const y = CANVAS_HEIGHT - CANVAS_HEIGHT * value + 1;
    let color = Math.floor((0xffffff / 2) * x).toString(16);
    color = x > 0 ? color : "#0xffffff";

    frequencyCanvas.beginPath();
    frequencyCanvas.moveTo(pastValues.x, pastValues.y);
    frequencyCanvas.strokeStyle = `#${color}`;
    frequencyCanvas.lineTo(x, y);
    frequencyCanvas.stroke();

    pastValues.x = x;
    pastValues.y = y;
  }
}

function clearTimeCanvas() {
  timeCanvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function clearFrequencyCanvas() {
  frequencyCanvas.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}
