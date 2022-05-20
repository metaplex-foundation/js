import fs from 'fs';
import path from 'path';

const fixtures = path.join(__dirname, '..', '..', 'fixtures');

export const rockPng = fs.readFileSync(path.join(fixtures, 'rock_80x80.png'));
export const bridgePng = fs.readFileSync(
  path.join(fixtures, 'bridge_80x80.png')
);
export const walrusPng = fs.readFileSync(
  path.join(fixtures, 'walrus_80x80.png')
);
export const benchPng = fs.readFileSync(path.join(fixtures, 'bench_80x80.png'));
