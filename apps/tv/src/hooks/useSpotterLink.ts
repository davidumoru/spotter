import {useEffect, useState} from 'react';
import type {ClientMessage, RepState, ServerMessage, WorkoutSummary} from '@spotter/protocol';
import {SERVER_URL} from '../config';

export type LinkStatus = 'connecting' | 'waiting' | 'live' | 'summary';

export interface SpotterLink {
  status: LinkStatus;
  code?: string;
  joinUrl?: string;
  phoneConnected: boolean;
  state?: RepState;
  summary?: WorkoutSummary;
}

export function reduce(link: SpotterLink, msg: ServerMessage): SpotterLink {
  switch (msg.type) {
    case 'room':
      return {status: 'waiting', code: msg.code, joinUrl: msg.joinUrl, phoneConnected: false};
    case 'peer':
      return msg.connected
        ? {...link, phoneConnected: true}
        : {...link, status: 'waiting', phoneConnected: false, state: undefined, summary: undefined};
    case 'state':
      return {...link, status: 'live', phoneConnected: true, state: msg.state, summary: undefined};
    case 'analyzing':
      return {...link, status: 'summary', summary: undefined};
    case 'summary':
      return {...link, status: 'summary', summary: msg.summary};
    default:
      return link;
  }
}

export function useSpotterLink(): SpotterLink {
  const [link, setLink] = useState<SpotterLink>({status: 'connecting', phoneConnected: false});

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
        setLink((l) => reduce(l, msg));
      };
      ws.onclose = () => {
        if (closed) return;
        setLink({status: 'connecting', phoneConnected: false});
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
