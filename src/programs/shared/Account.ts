import { AccountInfo, PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";

type GeneratedAccountData<T> = {
  fromAccountInfo: (info: AccountInfo<Buffer>) => [T, ...any];
};

export class Account<T> implements AccountInfo<T> {
  public readonly executable: boolean;
  public readonly owner: PublicKey;
  public readonly lamports: number;
  public readonly data: T;
  public readonly rentEpoch?: number | undefined;

  protected constructor(accountInfo: AccountInfo<T>) {
    this.executable = accountInfo.executable;
    this.owner = accountInfo.owner;
    this.lamports = accountInfo.lamports;
    this.data = accountInfo.data;
    this.rentEpoch = accountInfo.rentEpoch;
  }

  static parseAccountInfo<T>(
    accountInfo: AccountInfo<Buffer>,
    accountData: GeneratedAccountData<T>
  ): Account<T> {
    return new this<T>({
      ...accountInfo,
      data: accountData.fromAccountInfo(accountInfo)[0],
    });
  }
}
