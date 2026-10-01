import {DrawingUtils, FilesetResolver, PoseLandmarker} from '@mediapipe/tasks-vision';
import type {ServerMessage} from '@spotter/protocol';
import {SquatCounter} from './squat';
import {TvLink} from './connection';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const joinScreen = $<HTMLElement>('join');
const workoutScreen = $<HTMLElement>('workout');
const form = $<HTMLFormElement>('join-form');
const codeInput = $<HTMLInputElement>('code');
const joinError = $<HTMLParagraphElement>('join-error');
const video = $<HTMLVideoElement>('video');
const canvas = $<HTMLCanvasElement>('overlay');
const repsEl = $<HTMLSpanElement>('reps');
const angleEl = $<HTMLSpanElement>('angle');
const statusEl = $<HTMLSpanElement>('status');

const counter = new SquatCounter();
const link = new TvLink(onServerMessage);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  joinError.textContent = '';
  const button = form.querySelector('button')!;
  button.disabled = true;
  try {
    await link.connect(codeInput.value.trim());
    joinScreen.hidden = true;
    workoutScreen.hidden = false;
    await startWorkout();
  } catch (err) {
    joinError.textContent = (err as Error).message;
  } finally {
    button.disabled = false;
  }
});

function onServerMessage(msg: ServerMessage) {
  if (msg.type === 'peer' && msg.role === 'tv' && !msg.connected) {
    statusEl.textContent = 'TV disconnected';
  }
}

async function startWorkout() {
  statusEl.textContent = 'Loading model…';
  const [stream, landmarker] = await Promise.all([
    navigator.mediaDevices.getUserMedia({
      video: {facingMode: 'user', width: {ideal: 1280}, height: {ideal: 720}},
      audio: false,
    }),
    createLandmarker(),
  ]);
  video.srcObject = stream;
  await video.play();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d')!;
  const draw = new DrawingUtils(ctx);
  let lastVideoTime = -1;

  const loop = () => {
    if (video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      const result = landmarker.detectForVideo(video, performance.now());
      const landmarks = result.landmarks[0];

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (landmarks) {
        draw.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {color: '#ff6a1a', lineWidth: 4});
        draw.drawLandmarks(landmarks, {color: '#ffffff', radius: 3});
      }

      const state = counter.update(landmarks);
      repsEl.textContent = String(state.reps);
      angleEl.textContent = state.tracking ? `${state.kneeAngle}°` : '--°';
      statusEl.textContent = state.tracking ? (state.phase === 'down' ? 'Down' : 'Up') : 'Step into frame';
      link.sendState(state);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

async function createLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {modelAssetPath: MODEL_URL, delegate: 'GPU'},
    runningMode: 'VIDEO',
    numPoses: 1,
  });
}
