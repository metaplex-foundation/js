import type { Metaplex } from '@/Metaplex';
import {
  addAmounts,
  Amount,
  lamports,
  multiplyAmount,
  subtractAmounts,
} from '@/types';

const TRANSACTION_FEE = 5000;

export class UtilsClient {
  protected readonly metaplex: Metaplex;
  protected cachedRentPerEmptyAccount: Amount | null = null;
  protected cachedRentPerByte: Amount | null = null;

  constructor(metaplex: Metaplex) {
    this.metaplex = metaplex;
  }

  async estimate(
    bytes: number,
    numberOfAccounts: number = 1,
    numberOfTransactions: number = 1,
    useCache = true
  ): Promise<Amount> {
    const rent = await this.estimateRent(bytes, numberOfAccounts, useCache);
    const transactionFees = this.estimateTransactionFee(numberOfTransactions);

    return addAmounts(rent, transactionFees);
  }

  async estimateRent(
    bytes: number,
    numberOfAccounts: number = 1,
    useCache: boolean = true
  ): Promise<Amount> {
    if (
      !useCache ||
      this.cachedRentPerEmptyAccount === null ||
      this.cachedRentPerByte === null
    ) {
      const rentFor0Bytes = await this.metaplex.rpc().getRent(0);
      const rentFor1Byte = await this.metaplex.rpc().getRent(1);
      this.cachedRentPerEmptyAccount = rentFor0Bytes;
      this.cachedRentPerByte = subtractAmounts(rentFor1Byte, rentFor0Bytes);
    }

    const rentForAccounts = multiplyAmount(
      this.cachedRentPerEmptyAccount,
      numberOfAccounts
    );
    const rentForBytes = multiplyAmount(this.cachedRentPerByte, bytes);

    return addAmounts(rentForAccounts, rentForBytes);
  }

  estimateTransactionFee(numberOfTransactions: number = 1): Amount {
    // TODO(loris): Improve with an RPC call to get the current transaction fee.
    return lamports(numberOfTransactions * TRANSACTION_FEE);
  }
}
