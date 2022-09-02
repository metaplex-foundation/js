import {
  Beet,
  BeetReader,
  BeetWriter,
  isFixableBeet,
} from '@metaplex-foundation/beet';
import { Buffer } from 'buffer';
import {
  FailedToDeserializeDataError,
  FailedToSerializeDataError,
} from '../errors';

export type Serializer<T> = {
  description: string;
  serialize: (value: T) => Buffer;
  deserialize: (buffer: Buffer, offset?: number) => [T, number];
};

type BeetConstructor<T> = {
  name: string;
  deserialize: (data: Buffer, offset?: number) => [T, number];
};

export const createBeetSerializer = <T>(beet: Beet<T>): Serializer<T> => ({
  description: beet.description,
  serialize: (value: T) => {
    const fixedBeet = isFixableBeet(beet) ? beet.toFixedFromValue(value) : beet;
    const writer = new BeetWriter(fixedBeet.byteSize);
    writer.write(fixedBeet, value);
    return writer.buffer;
  },
  deserialize: (buffer: Buffer, offset?: number) => {
    const fixedBeet = isFixableBeet(beet)
      ? beet.toFixedFromData(buffer, offset ?? 0)
      : beet;
    const reader = new BeetReader(buffer, offset ?? 0);
    const value = reader.read(fixedBeet);
    return [value, reader.offset];
  },
});

export const serialize = <T>(
  serializer: Pick<Serializer<T>, 'description' | 'serialize'>,
  value: T
): Buffer => {
  try {
    return serializer.serialize(value);
  } catch (error) {
    throw new FailedToSerializeDataError(serializer.description, {
      cause: error as Error,
    });
  }
};

export const deserialize = <T>(
  serializer: Pick<Serializer<T>, 'description' | 'deserialize'>,
  value: Buffer
): [T, number] => {
  try {
    return serializer.deserialize(value);
  } catch (error) {
    throw new FailedToDeserializeDataError(serializer.description, {
      cause: error as Error,
    });
  }
};
