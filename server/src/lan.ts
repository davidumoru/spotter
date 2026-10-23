import {networkInterfaces} from 'node:os';

export function lanAddress(): string | undefined {
  const candidates = Object.entries(networkInterfaces())
    .flatMap(([name, addrs]) => (addrs ?? []).map((a) => ({name, ...a})))
    .filter((a) => a.family === 'IPv4' && !a.internal && !a.address.startsWith('127.'));
  return (candidates.find((a) => a.name === 'en0') ?? candidates[0])?.address;
}
