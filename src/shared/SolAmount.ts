import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';

export type SolAmountInput = number | string | Uint8Array | Buffer | BN | BigNumber | SolAmount;

const parseBigNumber = (
  input: number | string | Uint8Array | Buffer | BN | BigNumber
): BigNumber => {
  if (input instanceof Uint8Array || input instanceof BN) {
    const bn = new BN(input);
    return new BigNumber(bn.toString());
  }

  return new BigNumber(input);
};

export class SolAmount {
  protected readonly lamports: BigNumber;

  protected constructor(lamports: BigNumber) {
    this.lamports = lamports.decimalPlaces(0);
  }

  static fromLamports(lamports: SolAmountInput) {
    if (lamports instanceof SolAmount) {
      return new this(lamports.getLamports());
    }

    return new this(parseBigNumber(lamports));
  }

  static fromSol(sol: SolAmountInput) {
    if (sol instanceof SolAmount) {
      return new this(sol.getLamports());
    }

    const lamports = parseBigNumber(sol).multipliedBy(LAMPORTS_PER_SOL);

    return new this(lamports);
  }

  static zero() {
    return this.fromLamports(0);
  }

  plus(other: SolAmountInput): SolAmount {
    return this.execute(other, (a, b) => a.getLamports().plus(b.getLamports()));
  }

  minus(other: SolAmountInput): SolAmount {
    return this.execute(other, (a, b) => a.getLamports().minus(b.getLamports()));
  }

  multipliedBy(other: SolAmountInput): SolAmount {
    return this.execute(other, (a, b) => a.getLamports().multipliedBy(b.getSol()));
  }

  dividedBy(other: SolAmountInput): SolAmount {
    return this.execute(other, (a, b) => a.getLamports().dividedBy(b.getSol()));
  }

  modulo(other: SolAmountInput): SolAmount {
    return this.execute(other, (a, b) => a.getLamports().modulo(b.getLamports()));
  }

  isEqualTo(other: SolAmountInput): boolean {
    return this.lamports.isEqualTo(SolAmount.fromSol(other).getLamports());
  }

  isLessThan(other: SolAmountInput): boolean {
    return this.lamports.isLessThan(SolAmount.fromSol(other).getLamports());
  }

  isLessThanOrEqualTo(other: SolAmountInput): boolean {
    return this.lamports.isLessThanOrEqualTo(SolAmount.fromSol(other).getLamports());
  }

  isGreaterThan(other: SolAmountInput): boolean {
    return this.lamports.isGreaterThan(SolAmount.fromSol(other).getLamports());
  }

  isGreaterThanOrEqualTo(other: SolAmountInput): boolean {
    return this.lamports.isGreaterThanOrEqualTo(SolAmount.fromSol(other).getLamports());
  }

  isNegative(): boolean {
    return this.lamports.isNegative();
  }

  isPositive(): boolean {
    return this.lamports.isPositive();
  }

  isZero(): boolean {
    return this.lamports.isZero();
  }

  getLamports(): BigNumber {
    return this.lamports;
  }

  getSol(): BigNumber {
    return this.lamports.dividedBy(LAMPORTS_PER_SOL);
  }

  toLamports(): string {
    return this.lamports.toString();
  }

  toSol(decimals?: number, roundingMode?: BigNumber.RoundingMode): string {
    if (!decimals) {
      return this.getSol().toFormat();
    }

    return this.getSol().toFormat(decimals, roundingMode);
  }

  toString(): string {
    return this.toLamports();
  }

  protected execute(
    other: SolAmountInput,
    operation: (a: SolAmount, b: SolAmount) => BigNumber
  ): SolAmount {
    return SolAmount.fromLamports(operation(this, SolAmount.fromSol(other)));
  }
}
