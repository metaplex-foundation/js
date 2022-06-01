import type { Metaplex } from '@/Metaplex';
import { addAmounts, Amount, lamports, multiplyAmount } from '@/types';

const TRANSACTION_FEE = 5000;

export class UtilsClient {
  protected readonly metaplex: Metaplex;
  protected cachedRentPerByte: Amount | null = null;

  constructor(metaplex: Metaplex) {
    this.metaplex = metaplex;
  }

  async estimate(
    bytes: number,
    numberOfTransactions: number = 1,
    useCache = true
  ): Promise<Amount> {
    const rent = await this.estimateRent(bytes, useCache);
    const transactionFees = this.estimateTransactionFee(numberOfTransactions);

    return addAmounts(rent, transactionFees);
  }

  async estimateRent(bytes: number, useCache = true): Promise<Amount> {
    if (bytes === 0) {
      return lamports(0);
    }

    if (!useCache || this.cachedRentPerByte === null) {
      this.cachedRentPerByte = await this.metaplex.rpc().getRent(1);
    }

    return multiplyAmount(this.cachedRentPerByte, bytes);
  }

  estimateTransactionFee(numberOfTransactions: number = 1): Amount {
    return lamports(numberOfTransactions * TRANSACTION_FEE);
  }
}
