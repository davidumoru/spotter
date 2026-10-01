import 'react-native';
import {render} from '@testing-library/react-native';
import * as React from 'react';

import {App} from '../src/App';

class FakeWebSocket {
  onopen?: () => void;
  onmessage?: (ev: {data: string}) => void;
  onclose?: () => void;
  send() {}
  close() {}
}

beforeAll(() => {
  (globalThis as any).WebSocket = FakeWebSocket;
});

describe('App', () => {
  it('shows the pairing screen while connecting', () => {
    const screen = render(<App />);
    expect(screen.getByTestId('pair-code')).toBeTruthy();
    expect(screen.getByTestId('link-status')).toBeTruthy();
  });
});
