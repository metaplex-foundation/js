import {
  bench_80x80,
  bridge_80x80,
  rock_80x80,
  walrus_80x80,
} from '../fixtures/images';

export const rockPng = Buffer.from(rock_80x80, 'base64');
export const bridgePng = Buffer.from(bridge_80x80, 'base64');
export const walrusPng = Buffer.from(walrus_80x80, 'base64');
export const benchPng = Buffer.from(bench_80x80, 'base64');
