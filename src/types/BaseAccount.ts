import { AccountInfo, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { UnexpectedAccountError } from '@/errors';

type AccountDataConstructor<T> = {
  name: string;
  fromAccountInfo(
    accountInfo: AccountInfo<Buffer>,
    offset?: number
  ): [T, number];
};

export type Account<T> = AccountInfo<T> & {
  publicKey: PublicKey;
};

export type MaybeAccount<T> =
  | (Account<T> & { exists: true })
  | { publicKey: PublicKey; exists: false };

export type UnparsedAccount = Account<Buffer>;
export type UnparsedMaybeAccount = MaybeAccount<Buffer>;

export abstract class BaseAccount<T> implements Account<T> {
  public readonly publicKey: PublicKey;
  public readonly executable: boolean;
  public readonly owner: PublicKey;
  public readonly lamports: number;
  public readonly data: T;
  public readonly rentEpoch?: number | undefined;
  public readonly exists: true = true;

  protected constructor(accountValue: Account<T>) {
    this.publicKey = accountValue.publicKey;
    this.executable = accountValue.executable;
    this.owner = accountValue.owner;
    this.lamports = accountValue.lamports;
    this.data = accountValue.data;
    this.rentEpoch = accountValue.rentEpoch;
  }

  static parse<T>(
    unparsedAccount: UnparsedAccount,
    accountData: AccountDataConstructor<T>
  ): Account<T> {
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

  static parseMaybe<T>(
    unparsedMaybeAccount: UnparsedMaybeAccount,
    accountData: AccountDataConstructor<T>
  ): MaybeAccount<T> {
    if (!unparsedMaybeAccount.exists) {
      return unparsedMaybeAccount;
    }

    const parsedAccount = this.parse(unparsedMaybeAccount, accountData);
    return { ...parsedAccount, exists: true };
  }
}
