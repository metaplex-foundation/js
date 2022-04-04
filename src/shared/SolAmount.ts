import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';

export class SolAmount {
  public lamports: BN;

  constructor(lamports: BN) {
    this.lamports = lamports;
  }

  static fromLamports(lamports: number | string | number[] | Uint8Array | Buffer | BN) {
    return new this(new BN(lamports));
  }

  static fromSol(sol: number | string | BigNumber | BN) {
    if (sol instanceof BN) {
      sol = sol.toString();
    }

    const solBigNumber = new BigNumber(sol).multipliedBy(LAMPORTS_PER_SOL).decimalPlaces(0);
    return this.fromLamports(solBigNumber.toString());
  }

  toLamports(): BN {
    return this.lamports;
  }

  toSol(): BigNumber {
    return new BigNumber(this.lamports.toString()).dividedBy(LAMPORTS_PER_SOL).decimalPlaces(0);
  }

  toString(): string {
    return this.lamports.toString();
  }
}
