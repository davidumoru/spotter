import {createServer} from 'node:http';
import {WebSocketServer, WebSocket} from 'ws';
import {
  SERVER_PORT,
  WS_PATH,
  type ClientMessage,
  type ServerMessage,
} from '@spotter/protocol';

interface Room {
  tv?: WebSocket;
  phone?: WebSocket;
}

const rooms = new Map<string, Room>();

function send(ws: WebSocket | undefined, msg: ServerMessage) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function newCode(): string {
  for (;;) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    if (!rooms.has(code)) return code;
  }
}

const http = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {'content-type': 'application/json'});
    res.end(JSON.stringify({ok: true, rooms: rooms.size}));
    return;
  }
  res.writeHead(404).end();
});

const wss = new WebSocketServer({server: http, path: WS_PATH});

wss.on('connection', (ws) => {
  let code: string | undefined;
  let role: 'tv' | 'phone' | undefined;

  ws.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return send(ws, {type: 'error', message: 'Invalid JSON'});
    }

    switch (msg.type) {
      case 'hello': {
        role = 'tv';
        code = newCode();
        rooms.set(code, {tv: ws});
        send(ws, {type: 'room', code});
        console.log(`[room ${code}] tv connected`);
        break;
      }
      case 'join': {
        const room = rooms.get(msg.code);
        if (!room?.tv) {
          return send(ws, {type: 'error', message: `No TV with code ${msg.code}`});
        }
        role = 'phone';
        code = msg.code;
        room.phone?.close();
        room.phone = ws;
        send(ws, {type: 'joined', code});
        send(room.tv, {type: 'peer', role: 'phone', connected: true});
        console.log(`[room ${code}] phone joined`);
        break;
      }
      case 'state': {
        if (role !== 'phone' || !code) return;
        send(rooms.get(code)?.tv, {type: 'state', state: msg.state});
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    if (role === 'tv' && room.tv === ws) {
      send(room.phone, {type: 'peer', role: 'tv', connected: false});
      room.phone?.close();
      rooms.delete(code);
      console.log(`[room ${code}] closed`);
    } else if (role === 'phone' && room.phone === ws) {
      room.phone = undefined;
      send(room.tv, {type: 'peer', role: 'phone', connected: false});
      console.log(`[room ${code}] phone left`);
    }
  });
});

http.listen(SERVER_PORT, () => {
  console.log(`Spotter server on http://localhost:${SERVER_PORT} (ws path ${WS_PATH})`);
});
