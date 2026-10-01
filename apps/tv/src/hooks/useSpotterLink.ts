import {useEffect, useState} from 'react';
import type {ClientMessage, RepState, ServerMessage} from '@spotter/protocol';
import {SERVER_URL} from '../config';

export type LinkStatus = 'connecting' | 'waiting' | 'live';

export interface SpotterLink {
  status: LinkStatus;
  code?: string;
  state?: RepState;
}

export function useSpotterLink(): SpotterLink {
  const [link, setLink] = useState<SpotterLink>({status: 'connecting'});

  useEffect(() => {
    let ws: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(SERVER_URL);
      ws.onopen = () => {
        const hello: ClientMessage = {type: 'hello', role: 'tv'};
        ws?.send(JSON.stringify(hello));
      };
      ws.onmessage = (ev) => {
        const msg = JSON.parse(String(ev.data)) as ServerMessage;
        switch (msg.type) {
          case 'room':
            setLink({status: 'waiting', code: msg.code});
            break;
          case 'peer':
            setLink((l) => ({...l, status: msg.connected ? 'live' : 'waiting', state: msg.connected ? l.state : undefined}));
            break;
          case 'state':
            setLink((l) => ({...l, status: 'live', state: msg.state}));
            break;
        }
      };
      ws.onclose = () => {
        if (closed) return;
        setLink({status: 'connecting'});
        retry = setTimeout(connect, 2000);
      };
    };

    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      ws?.close();
    };
  }, []);

  return link;
}
