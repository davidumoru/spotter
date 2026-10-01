import {SERVER_PORT, WS_PATH} from '@spotter/protocol';

// 10.0.2.2 is the host Mac from inside the Vega Virtual Device; use the Mac LAN IP on a real Fire TV.
export const SERVER_HOST = '10.0.2.2';
export const SERVER_URL = `ws://${SERVER_HOST}:${SERVER_PORT}${WS_PATH}`;
