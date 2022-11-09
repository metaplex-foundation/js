import { Buffer } from 'buffer';
import test, { Test } from 'tape';
import { deserializeFeatureFlags, serializeFeatureFlags } from '@/index';

const assertSerialize = (
  t: Test,
  deserializedBinary: string,
  expectedSerializedHex: string,
  bytes?: number,
  backward = false
) => {
  const actualSerializedHex = serializeFeatureFlags(
    [...deserializedBinary].map((x) => x === '1'),
    bytes,
    backward
  ).toString('hex');

  t.equal(
    actualSerializedHex,
    expectedSerializedHex,
    `serialize(${deserializedBinary}) = ${actualSerializedHex}`
  );
};

const assertDeserialize = (
  t: Test,
  serializedHex: string,
  expectedDeserializedBinary: string,
  numberOfFlags?: number,
  backward = false
) => {
  const actualDeserialized = deserializeFeatureFlags(
    Buffer.from(serializedHex, 'hex'),
    numberOfFlags,
    backward
  );
  const actualDeserializedBinary = actualDeserialized
    .map((x) => (x ? '1' : '0'))
    .join('');

  t.equal(
    actualDeserializedBinary,
    expectedDeserializedBinary,
    `deserialize(${serializedHex}) = ${actualDeserializedBinary}`
  );
};

const assertBoth = (
  t: Test,
  bytes: number,
  deserialized: string,
  serializedHex: string,
  backward = false
) => {
  assertSerialize(t, deserialized, serializedHex, bytes, backward);
  assertDeserialize(t, serializedHex, deserialized, bytes * 8, backward);
};

test('[FeatureFlags] it can (de)serialize arrays of boolean', (t: Test) => {
  // 1 byte forward.
  assertBoth(t, 1, '00000000', '00', false);
  assertBoth(t, 1, '00000001', '01', false);
  assertBoth(t, 1, '00000010', '02', false);
  assertBoth(t, 1, '00000100', '04', false);
  assertBoth(t, 1, '00001000', '08', false);
  assertBoth(t, 1, '00010000', '10', false);
  assertBoth(t, 1, '00100000', '20', false);
  assertBoth(t, 1, '01000000', '40', false);
  assertBoth(t, 1, '10000000', '80', false);
  assertBoth(t, 1, '11111111', 'ff', false);
  assertBoth(t, 1, '11000111', 'c7', false);
  assertBoth(t, 1, '00101001', '29', false);

  // 1 byte backward.
  assertBoth(t, 1, '00000000', '00', true);
  assertBoth(t, 1, '10000000', '01', true);
  assertBoth(t, 1, '01000000', '02', true);
  assertBoth(t, 1, '00100000', '04', true);
  assertBoth(t, 1, '00010000', '08', true);
  assertBoth(t, 1, '00001000', '10', true);
  assertBoth(t, 1, '00000100', '20', true);
  assertBoth(t, 1, '00000010', '40', true);
  assertBoth(t, 1, '00000001', '80', true);
  assertBoth(t, 1, '11111111', 'ff', true);
  assertBoth(t, 1, '11000111', 'e3', true);
  assertBoth(t, 1, '00101001', '94', true);

  // 2 bytes forward.
  assertBoth(t, 2, '1000000000000000', '8000', false);
  assertBoth(t, 2, '0000000000000001', '0001', false);
  assertBoth(t, 2, '1100011100101001', 'c729', false);

  // 2 bytes backward.
  assertBoth(t, 2, '1000000000000000', '0001', true);
  assertBoth(t, 2, '0000000000000001', '8000', true);
  assertBoth(t, 2, '1100011100101001', '94e3', true);

  // Truncated bytes.
  assertSerialize(t, '1100011100101001', 'c7', 1, false);
  assertDeserialize(t, 'c729', '11000111', 8, false);
  assertSerialize(t, '1100011100101001', 'e3', 1, true);
  assertDeserialize(t, '94e3', '11000111', 8, true);

  // Dynamic bytes forward.
  assertSerialize(t, '11000111', 'c7', undefined, false);
  assertSerialize(t, '110001110', 'c700', undefined, false);
  assertSerialize(t, '1100011100', 'c700', undefined, false);
  assertSerialize(t, '11000111000000000', 'c70000', undefined, false);
  assertDeserialize(t, 'c7', '11000111', undefined, false);
  assertDeserialize(t, 'c700', '1100011100000000', undefined, false);
  assertDeserialize(t, 'c70000', '110001110000000000000000', undefined, false);

  // Dynamic bytes backward.
  assertSerialize(t, '11000111', 'e3', undefined, true);
  assertSerialize(t, '110001110', '00e3', undefined, true);
  assertSerialize(t, '1100011100', '00e3', undefined, true);
  assertSerialize(t, '11000111000000000', '0000e3', undefined, true);
  assertDeserialize(t, 'e3', '11000111', undefined, true);
  assertDeserialize(t, 'e300', '0000000011000111', undefined, true);
  assertDeserialize(t, 'e30000', '000000000000000011000111', undefined, true);

  t.end();
});
