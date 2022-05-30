import { AccountInfo, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { UnexpectedAccountError } from '@/errors';

export type Account<T> = Readonly<{
  publicKey: PublicKey;
  executable: boolean;
  owner: PublicKey;
  lamports: number;
  data: T;
  rentEpoch?: number;
}>;

export type MaybeAccount<T> =
  | (Account<T> & { exists: true })
  | { publicKey: PublicKey; exists: false };

export type UnparsedAccount = Account<Buffer>;
export type UnparsedMaybeAccount = MaybeAccount<Buffer>;

type AccountDataConstructor<T> = {
  name: string;
  fromAccountInfo(
    accountInfo: AccountInfo<Buffer>,
    offset?: number
  ): [T, number];
};

export function parseAccount<T>(
  unparsedAccount: UnparsedMaybeAccount,
  accountData: AccountDataConstructor<T>
): MaybeAccount<T>;
export function parseAccount<T>(
  unparsedAccount: UnparsedAccount,
  accountData: AccountDataConstructor<T>
): Account<T>;
export function parseAccount<T>(
  unparsedAccount: UnparsedAccount | UnparsedMaybeAccount,
  accountData: AccountDataConstructor<T>
): Account<T> | MaybeAccount<T> {
  if ('exists' in unparsedAccount && !unparsedAccount.exists) {
    return unparsedAccount;
  }

  try {
    const data: T = accountData.fromAccountInfo(unparsedAccount)[0];
    return { ...unparsedAccount, data };
  } catch (error) {
    throw new UnexpectedAccountError(
      unparsedAccount.publicKey,
      accountData.name,
      error as Error
    );
  }
}
