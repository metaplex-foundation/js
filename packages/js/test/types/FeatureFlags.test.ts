import { Buffer } from 'buffer';
import test, { Test } from 'tape';
import { deserializeFeatureFlags, serializeFeatureFlags } from '@/index';

const assertSerialize = (
  t: Test,
  deserializedBinary: string,
  expectedSerializedHex: string,
  bytes?: number,
  littleEndian = true
) => {
  const actualSerializedHex = serializeFeatureFlags(
    [...deserializedBinary].map((x) => x === '1'),
    bytes,
    littleEndian
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
  littleEndian = true
) => {
  const [actualDeserialized] = deserializeFeatureFlags(
    Buffer.from(serializedHex, 'hex'),
    numberOfFlags ? numberOfFlags : 8, // TODO(loris): make optional.
    0,
    littleEndian
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
  littleEndian = true
) => {
  assertSerialize(t, deserialized, serializedHex, bytes, littleEndian);
  assertDeserialize(t, serializedHex, deserialized, bytes * 8, littleEndian);
};

test('[FeatureFlags] it can (de)serialize arrays of boolean', (t: Test) => {
  // 1 byte.
  assertBoth(t, 1, '00000000', '00');
  assertBoth(t, 1, '10000000', '01');
  assertBoth(t, 1, '01000000', '02');
  assertBoth(t, 1, '00100000', '04');
  assertBoth(t, 1, '00010000', '08');
  assertBoth(t, 1, '00001000', '10');
  assertBoth(t, 1, '00000100', '20');
  assertBoth(t, 1, '00000010', '40');
  assertBoth(t, 1, '00000001', '80');
  assertBoth(t, 1, '11111111', 'ff');
  assertBoth(t, 1, '11000111', 'e3');
  assertBoth(t, 1, '00101001', '94');

  // 2 bytes.
  assertBoth(t, 2, '1100011100101001', 'e394', true);
  // assertBoth(t, 2, '1100011100101001', '94e3', false);

  // Dynamic bytes.
  // assertSerialize(t, '1100011100', 'e300');

  t.end();
});
