# Spotter

An AI fitness coach for Fire TV that uses your phone as the camera.

Scan the QR code on the TV, prop your iPhone up and start squatting. The phone tracks your pose on device, counts reps, calls out half reps and streams it all to the TV. When you finish a set, the TV shows a short coaching summary, written by Amazon Bedrock (Nova Lite) when it's available and by a built-in coach otherwise.

Built for the Fire TV track of the [Amazon Developer Hackathon](https://amazonappdev2026.devpost.com/).

## How it works

```
iPhone (MediaPipe pose) ──wss──▶ Node server ──ws──▶ Fire TV (Vega OS)
                                      │
                                Amazon Bedrock
```

| Part | Path | Stack |
| --- | --- | --- |
| TV app | `apps/tv` | React Native 0.83 on Vega OS |
| Phone app | `apps/phone` | Vite, TypeScript, MediaPipe Pose, Web Speech |
| Server | `server` | Node, WebSocket, Bedrock Converse API (Nova Lite) |
| Protocol | `packages/protocol` | Shared message types |

Video never leaves the phone. If Bedrock is unavailable, the server falls back to a built-in coach.

## Run it

Needs Node 20, the [Vega SDK](https://developer.amazon.com/docs/vega/0.24/install-vega-sdk.html) 0.24 and an iPhone on the same Wi-Fi. For Bedrock coaching, configure AWS credentials with access to Amazon Nova Lite in `us-east-1`.

```bash
npm install && (cd apps/tv && npm install)

npm run dev:server   # terminal 1
npm run dev:phone    # terminal 2

source ~/vega/env && vega virtual-device start
cd apps/tv && npm run build:debug
vega run-app build/aarch64-debug/spotter-tv_aarch64.vpkg com.davidumoru.spotter -d VirtualDevice
```

Scan the QR code on the TV with your iPhone, accept the self-signed certificate and allow the camera. On a physical Fire TV, set `SERVER_HOST` in `apps/tv/src/config.ts` to your Mac's LAN IP.

## Tests

```bash
npm test && (cd apps/tv && npx jest)
```

## Friction log

[`FRICTION_LOG.md`](FRICTION_LOG.md) covers the rough edges I hit with the Vega SDK. The sample app fixes were merged upstream in [react-native-multi-tv-app-sample#130](https://github.com/AmazonAppDev/react-native-multi-tv-app-sample/pull/130).

## License

[MIT](LICENSE)
