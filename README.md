# Spotter

An AI fitness coach for Fire TV that uses your phone as the camera.

Prop your iPhone up, scan the QR code on the TV, and start squatting. The phone tracks your body with on-device pose estimation, counts your reps, calls out cues ("Go lower", "Great depth"), and streams everything to the big screen. When you finish a set, Amazon Bedrock looks at the reps and gives you a short coaching summary on the TV and out loud.

Built for the Fire TV track of the [Build, Ship, Shape: Amazon Developer Hackathon](https://amazonappdev2026.devpost.com/).

## Why the TV

A phone screen is unreadable from six feet away mid-squat, and your TV is already the screen in the room you work out in. Spotter puts the numbers where you can see them and keeps the camera where it can see you. Nothing extra to buy: a Fire TV and the phone in your pocket.

## How it works

```
iPhone (Safari)                         Spotter server (Node)                 Fire TV (Vega OS)
camera → MediaPipe Pose (on device)     pairs TV ↔ phone by 4-digit room      QR pairing screen
→ knee angle → rep / half-rep counter   relays live state over WebSocket      live reps, depth bar, cues
→ spoken cues                    ──wss──▶ on "Finish": Amazon Bedrock ──ws──▶ AI set summary
```

- **Phone (`apps/phone`)**: Vite + TypeScript web app. [MediaPipe Pose Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker) runs in the browser. Spotter measures the hip-knee-ankle angle on the more visible leg, smooths it, and counts a rep when you go below 100° and come back above 160°. A dip below 140° that never reaches depth counts as a half rep and triggers "Go lower". Video never leaves the phone; only numbers are sent.
- **Server (`server`)**: Node WebSocket relay. The TV gets a room code and a join URL (encoded as a QR code). When the phone finishes a set, the server sends the rep log to **Amazon Bedrock** (Converse API, Amazon Nova Lite by default) for a 2–3 sentence coaching summary. If Bedrock is unavailable, it falls back to a rule-based coach so the app always works.
- **TV (`apps/tv`)**: React Native 0.83 app for **Vega OS**, generated from the Vega SDK `helloWorld` template. Pairing screen with a QR code, live screen (rep count, depth bar, status, cue banner) and summary screen. The UI is laid out on a 1920×1080 canvas and scaled to the device.
- **Protocol (`packages/protocol`)**: shared, dependency-free TypeScript message types used by all three.

## Requirements

- macOS on Apple Silicon (tested on macOS 15.7)
- Node 20 (`.node-version`), npm
- [Vega SDK](https://developer.amazon.com/docs/vega/0.24/install-vega-sdk.html) 0.24 with the Vega Virtual Device, or a Fire TV running Vega OS 1.2+
- An iPhone (iOS Safari) on the same Wi-Fi as the Mac
- Optional: AWS credentials with Amazon Bedrock access to `amazon.nova-lite-v1:0` in `us-east-1`

## Run it

```bash
npm install
(cd apps/tv && npm install)
```

**1. Start the server**

```bash
npm run dev:server
```

To enable Bedrock coaching, make AWS credentials available to the process first (`aws configure`, `AWS_PROFILE`, or env vars). Optional settings:

| Variable | Default | Purpose |
| --- | --- | --- |
| `AWS_REGION` | `us-east-1` | Bedrock region |
| `BEDROCK_MODEL_ID` | `us.amazon.nova-lite-v1:0` | Any Bedrock Converse model or inference profile |
| `PHONE_URL` | `https://<Mac LAN IP>:5173` | Base URL encoded in the TV's QR code |

**2. Start the phone app**

```bash
npm run dev:phone
```

It serves over self-signed HTTPS (iOS only allows camera access on secure pages) and proxies `/ws` to the server.

**3. Run the TV app**

```bash
source ~/vega/env
vega virtual-device start
cd apps/tv
npm run build:debug
vega run-app build/aarch64-debug/spotter-tv_aarch64.vpkg com.davidumoru.spotter -d VirtualDevice
```

On the Virtual Device the app reaches the Mac at `10.0.2.2`. For a physical Fire TV, set `SERVER_HOST` in `apps/tv/src/config.ts` to your Mac's LAN IP and use the `armv7` or `aarch64` package for your device.

**4. Work out**

Scan the QR code on the TV with your iPhone camera (or open the phone URL and type the code). Accept the self-signed certificate warning, tap **Connect** and allow camera access. Stand side-on to the phone with your whole body in view, then squat. Tap **Finish** for your AI summary and **Start a new set** to go again.

## Tests

```bash
npm test                      # phone rep counter + server coaching
(cd apps/tv && npx jest)      # TV screens and link state
```

## Project structure

```
apps/phone         iPhone web app (camera, pose, rep counter, voice)
apps/tv            Fire TV app for Vega OS (React Native 0.83)
server             WebSocket relay + Amazon Bedrock coaching
packages/protocol  Shared message types
FRICTION_LOG.md    Developer friction log for the Amazon tools used
```

## Friction log and contributions

[`FRICTION_LOG.md`](FRICTION_LOG.md) records every rough edge hit while building with the Vega SDK, the Vega Virtual Device and the Amazon sample apps. Three of those fixes were contributed upstream and merged: [AmazonAppDev/react-native-multi-tv-app-sample#130](https://github.com/AmazonAppDev/react-native-multi-tv-app-sample/pull/130).

## License

[MIT](LICENSE)
