import {WS_PATH, type ClientMessage, type RepState, type ServerMessage} from '@spotter/protocol';

const SEND_INTERVAL_MS = 100;

export class TvLink {
  private ws?: WebSocket;
  private lastSent = 0;
  private lastReps = -1;

  constructor(private onMessage: (msg: ServerMessage) => void) {}

  connect(code: string): Promise<void> {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}${WS_PATH}`);
    this.ws = ws;

    return new Promise((resolve, reject) => {
      ws.onopen = () => this.send({type: 'join', role: 'phone', code});
      ws.onerror = () => reject(new Error('Could not reach the Spotter server.'));
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data) as ServerMessage;
        if (msg.type === 'joined') resolve();
        if (msg.type === 'error') reject(new Error(msg.message));
        this.onMessage(msg);
      };
    });
  }

  sendState(state: RepState) {
    const now = performance.now();
    if (state.reps === this.lastReps && now - this.lastSent < SEND_INTERVAL_MS) return;
    this.lastSent = now;
    this.lastReps = state.reps;
    this.send({type: 'state', state});
  }

  private send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }
}
