import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { AccountNotFoundError, UnexpectedAccountError } from '@/errors';

export type Account<T> = Readonly<{
  publicKey: PublicKey;
  executable: boolean;
  owner: PublicKey;
  lamports: number;
  data: T;
  rentEpoch?: number;
}>;

export type MaybeAccount<T> =
  | (Account<T> & { readonly exists: true })
  | { readonly publicKey: PublicKey; readonly exists: false };

export type UnparsedAccount = Account<Buffer>;
export type UnparsedMaybeAccount = MaybeAccount<Buffer>;

export type AccountParser<T> = {
  name: string;
  deserialize: (data: Buffer, offset?: number) => [T, number];
};

export type AccountParsingFunction<T> = {
  (unparsedAccount: UnparsedAccount): Account<T>;
  (unparsedAccount: UnparsedMaybeAccount): MaybeAccount<T>;
};

export function parseAccount<T>(
  account: UnparsedMaybeAccount,
  parser: AccountParser<T>
): MaybeAccount<T>;
export function parseAccount<T>(
  account: UnparsedAccount,
  parser: AccountParser<T>
): Account<T>;
export function parseAccount<T>(
  account: UnparsedAccount | UnparsedMaybeAccount,
  parser: AccountParser<T>
): Account<T> | MaybeAccount<T> {
  if ('exists' in account && !account.exists) {
    return account;
  }
  return getAccountParsingFunction(parser)(account);
}

export function getAccountParsingFunction<T>(
  parser: AccountParser<T>
): AccountParsingFunction<T> {
  function parse(account: UnparsedAccount): Account<T>;
  function parse(account: UnparsedMaybeAccount): MaybeAccount<T>;
  function parse(
    account: UnparsedAccount | UnparsedMaybeAccount
  ): Account<T> | MaybeAccount<T> {
    if ('exists' in account && !account.exists) {
      return account;
    }

    try {
      const data: T = parser.deserialize(account.data)[0];
      return { ...account, data };
    } catch (error) {
      throw new UnexpectedAccountError(
        account.publicKey,
        parser.name,
        error as Error
      );
    }
  }

  return parse;
}

export function assertAccountExists<T>(
  account: MaybeAccount<T>,
  name?: string,
  solution?: string
): asserts account is Account<T> & { exists: true } {
  if (!account.exists) {
    throw new AccountNotFoundError(account.publicKey, name, solution);
  }
}
