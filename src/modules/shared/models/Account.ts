import { AccountInfo, PublicKey } from "@solana/web3.js";

type AccountData<T> = {
  fromAccountInfo: (info: AccountInfo<Buffer>) => [T, ...any]
}

export class Account<T> implements AccountInfo<T> {

  private constructor(
    public readonly executable: boolean,
    public readonly owner: PublicKey,
    public readonly lamports: number,
    public readonly data: T,
    public readonly rentEpoch?: number | undefined,
  ) {}

  static fromAccountInfo<T>(accountInfo: AccountInfo<T>) {
    return new Account<T>(
      accountInfo.executable,
      accountInfo.owner,
      accountInfo.lamports,
      accountInfo.data,
      accountInfo.rentEpoch,
    );
  }

  static parseAccountInfo<T>(accountInfo: AccountInfo<Buffer>, accountData: AccountData<T>): Account<T> {
    return this.fromAccountInfo({
      ...accountInfo,
      data: accountData.fromAccountInfo(accountInfo)[0],
    })
  }
}
