import { AccountInfo, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { UnexpectedAccountError } from '@/errors';

type AccountDataConstructor<T> = {
  name: string;
  fromAccountInfo: (info: AccountInfo<Buffer>) => [T, ...any];
};

export class Account<T> implements AccountInfo<T> {
  public readonly publicKey: PublicKey;
  public readonly executable: boolean;
  public readonly owner: PublicKey;
  public readonly lamports: number;
  public readonly data: T;
  public readonly rentEpoch?: number | undefined;

  protected constructor(publicKey: PublicKey, accountInfo: AccountInfo<T>) {
    this.publicKey = publicKey;
    this.executable = accountInfo.executable;
    this.owner = accountInfo.owner;
    this.lamports = accountInfo.lamports;
    this.data = accountInfo.data;
    this.rentEpoch = accountInfo.rentEpoch;
  }

  static parseAccountInfo<T>(
    publicKey: PublicKey,
    accountInfo: AccountInfo<Buffer>,
    accountData: AccountDataConstructor<T>
  ): Account<T> {
    try {
      const data: T = accountData.fromAccountInfo(accountInfo)[0];
      return new this<T>(publicKey, { ...accountInfo, data });
    } catch (error) {
      throw new UnexpectedAccountError(publicKey, accountData.name, error as Error);
    }
  }
}
