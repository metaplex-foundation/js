import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';

export type SolAmountInput = number | string | Uint8Array | Buffer | BN | BigNumber | SolAmount;

const parseBigNumber = (input: SolAmountInput): BigNumber => {
  if (input instanceof SolAmount) {
    return input.getLamports();
  }

  if (input instanceof Uint8Array || input instanceof BN) {
    const bn = new BN(input);
    return new BigNumber(bn.toString());
  }

  return new BigNumber(input);
}

export class SolAmount {
  protected readonly lamports: BigNumber;

  constructor(lamports: SolAmountInput) {
    this.lamports = parseBigNumber(lamports).decimalPlaces(0);
  }

  static fromLamports(lamports: SolAmountInput) {
    return new this(lamports);
  }

  static fromSol(sol: SolAmountInput) {
    const solBigNumber = parseBigNumber(sol).multipliedBy(LAMPORTS_PER_SOL).decimalPlaces(0);

    return this.fromLamports(solBigNumber.toString());
  }

  plus(other: SolAmountInput): SolAmount {
    return this.execute(other, (a, b) => a.plus(b));
  }

  minus(other: SolAmountInput): SolAmount {
    return this.execute(other, (a, b) => a.minus(b));
  }

  multipliedBy(other: SolAmountInput): SolAmount {
    return this.execute(other, (a, b) => a.multipliedBy(b));
  }

  dividedBy(other: SolAmountInput): SolAmount {
    return this.execute(other, (a, b) => a.dividedBy(b));
  }

  modulo(other: SolAmountInput): SolAmount {
    return this.execute(other, (a, b) => a.modulo(b));
  }

  isEqualTo(other: SolAmountInput): boolean {
    return this.lamports.isEqualTo(parseBigNumber(other));
  }

  isLessThan(other: SolAmountInput): boolean {
    return this.lamports.isLessThan(parseBigNumber(other));
  }

  isLessThanOrEqualTo(other: SolAmountInput): boolean {
    return this.lamports.isLessThanOrEqualTo(parseBigNumber(other));
  }

  isGreaterThan(other: SolAmountInput): boolean {
    return this.lamports.isGreaterThan(parseBigNumber(other));
  }

  isGreaterThanOrEqualTo(other: SolAmountInput): boolean {
    return this.lamports.isGreaterThanOrEqualTo(parseBigNumber(other));
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

  protected execute(other: SolAmountInput, operation: (a: BigNumber, b: BigNumber) => BigNumber): SolAmount {
    return new SolAmount(operation(this.lamports, parseBigNumber(other)));
  }
}
