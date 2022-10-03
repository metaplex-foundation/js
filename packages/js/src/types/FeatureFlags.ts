import { Buffer } from 'buffer';

export type FeatureFlags = boolean[];

/**
 * Serializes an array of boolean into a Buffer. The `byteSize` parameter
 * can be used to create a fixed-size Buffer, otherwise the Buffer will
 * have the minimum amount of bytes required to store the boolean array.
 */
export const serializeFeatureFlags = (
  features: FeatureFlags,
  byteSize?: number,
  littleEndian = true
): Buffer => {
  const bytes: number[] = [];
  let currentByte = 0;

  for (let i = 0; i < features.length; i++) {
    const byteIndex = i % 8;
    if (littleEndian) {
      currentByte |= Number(features[i]) << byteIndex;
    } else {
      currentByte |= Number(features[i]) >> byteIndex;
    }
    if (byteIndex === 7) {
      bytes.push(currentByte);
      currentByte = 0;
    }
  }

  const buffer = Buffer.from(bytes);
  return byteSize === undefined ? buffer : Buffer.concat([buffer], byteSize);
};

/**
 * Parses a Buffer into an array of booleans using the bits
 * of the buffer. The number of flags is required to know
 * how many bits to read and how many booleans to return.
 */
export const deserializeFeatureFlags = (
  buffer: Buffer,
  numberOfFlags: number,
  offset = 0,
  littleEndian = true
): [FeatureFlags, number] => {
  const booleans: boolean[] = [];
  const byteSize = Math.ceil(numberOfFlags / 8);
  const bytes = buffer.slice(offset, offset + byteSize);

  for (let byte of bytes) {
    for (let i = 0; i < 8; i++) {
      if (littleEndian) {
        booleans.push(Boolean(byte & 1));
        byte >>= 1;
      } else {
        booleans.push(Boolean(byte & 0b1000_0000));
        byte <<= 1;
      }
    }
  }

  return [booleans.slice(0, numberOfFlags), offset + byteSize];
};
