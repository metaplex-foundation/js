import {
  Beet,
  BeetReader,
  BeetWriter,
  isFixableBeet,
} from '@metaplex-foundation/beet';
import { Buffer } from 'buffer';
import { Account, UnparsedAccount } from './Account';
import {
  FailedToDeserializeDataError,
  FailedToSerializeDataError,
  UnexpectedAccountError,
} from '../errors';

export type Serializer<T> = {
  description: string;
  serialize: (value: T) => Buffer;
  deserialize: (buffer: Buffer, offset?: number) => [T, number];
};

export const createSerializerFromBeet = <T>(beet: Beet<T>): Serializer<T> => ({
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

type BeetClass<T> = {
  name: string;
  deserialize: (data: Buffer, offset?: number) => [T, number];
};

export const createDeserializerFromBeetClass = <T>(
  beet: BeetClass<T>,
  description?: string
): Pick<Serializer<T>, 'description' | 'deserialize'> => ({
  description: description ?? beet.name,
  deserialize: (buffer: Buffer, offset?: number) => {
    return beet.deserialize(buffer, offset);
  },
});

export const serialize = <T>(
  value: T,
  serializer: Pick<Serializer<T>, 'description' | 'serialize'>
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
  value: Buffer,
  serializer: Pick<Serializer<T>, 'description' | 'deserialize'>
): [T, number] => {
  try {
    return serializer.deserialize(value);
  } catch (error) {
    throw new FailedToDeserializeDataError(serializer.description, {
      cause: error as Error,
    });
  }
};

export const deserializeAccount = <T>(
  serializer: Pick<Serializer<T>, 'description' | 'deserialize'>,
  account: UnparsedAccount
): Account<T> => {
  try {
    const data: T = serializer.deserialize(account.data)[0];
    return { ...account, data };
  } catch (error) {
    throw new UnexpectedAccountError(
      account.publicKey,
      serializer.description,
      { cause: error as Error }
    );
  }
};

export const deserializeAccountFromBeetClass = <T>(
  account: UnparsedAccount,
  beetClass: BeetClass<T>,
  description?: string
): Account<T> => {
  const serializer = createDeserializerFromBeetClass(beetClass, description);
  return deserializeAccount(serializer, account);
};
