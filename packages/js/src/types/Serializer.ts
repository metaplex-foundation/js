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
  UnexpectedAccountError,
} from '../errors';
import {
  Account,
  MaybeAccount,
  UnparsedAccount,
  UnparsedMaybeAccount,
} from './Account';

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

export type SolitaType<T> = {
  name: string;
  deserialize: (data: Buffer, offset?: number) => [T, number];
  fromArgs: (args: T) => {
    serialize: () => [Buffer, number];
  };
};

export const createSerializerFromSolitaType = <T>(
  solitaType: SolitaType<T>,
  description?: string
): Serializer<T> => ({
  description: description ?? solitaType.name,
  serialize: (value: T) => {
    return solitaType.fromArgs(value).serialize()[0];
  },
  deserialize: (buffer: Buffer, offset?: number) => {
    return solitaType.deserialize(buffer, offset);
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

export function deserializeAccount<T>(
  account: UnparsedMaybeAccount,
  serializer: Pick<Serializer<T>, 'description' | 'deserialize'>
): MaybeAccount<T>;
export function deserializeAccount<T>(
  account: UnparsedAccount,
  serializer: Pick<Serializer<T>, 'description' | 'deserialize'>
): Account<T>;
export function deserializeAccount<T>(
  account: UnparsedAccount | UnparsedMaybeAccount,
  serializer: Pick<Serializer<T>, 'description' | 'deserialize'>
): Account<T> | MaybeAccount<T> {
  if ('exists' in account && !account.exists) {
    return account;
  }

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
}
