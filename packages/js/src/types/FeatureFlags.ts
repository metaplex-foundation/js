import { Buffer } from 'buffer';
import { Serializer, serialize, deserialize } from './Serializer';

export type FeatureFlags = boolean[];

export const featureFlagSerializer: Serializer<FeatureFlags> = {
  description: 'FeatureFlags',
  serialize: (features: FeatureFlags): Buffer => {
    const bytes: number[] = [];
    let currentByte = 0;
    for (let i = 0; i < features.length; i++) {
      const byteIndex = i % 8;
      currentByte |= Number(features[i]) << byteIndex;
      if (byteIndex === 7) {
        bytes.push(currentByte);
        currentByte = 0;
      }
    }
    return Buffer.concat([Buffer.from(bytes)], 8);
  },
  deserialize: (buffer: Buffer, offset: number = 0): [FeatureFlags, number] => {
    const booleans: boolean[] = [];
    const bytes = buffer.slice(offset, offset + 8);
    for (let byte of bytes) {
      for (let i = 0; i < 8; i++) {
        booleans.push(Boolean(byte & 1));
        byte >>= 1;
      }
    }
    return [booleans, bytes.length];
  },
};

export const serializeFeatureFlags = (features: FeatureFlags): Buffer =>
  serialize(features, featureFlagSerializer);

export const deserializeFeatureFlags = (buffer: Buffer): FeatureFlags =>
  deserialize(buffer, featureFlagSerializer)[0];
