import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';

export type SolAmountInput = number | string | Uint8Array | Buffer | BN | BigNumber | SolAmount;

const parseBigNumber = (input: SolAmountInput, useLamports: boolean = false): BigNumber => {
  if (input instanceof SolAmount) {
    return useLamports ? input.getLamports() : input.getSol();
  }

  if (input instanceof Uint8Array || input instanceof BN) {
    const bn = new BN(input);
    return new BigNumber(bn.toString());
  }

  return new BigNumber(input);
}

export class SolAmount {
  protected readonly lamports: BigNumber;

  protected constructor(lamports: BigNumber) {
    this.lamports = lamports.decimalPlaces(0);
  }

  static fromLamports(lamports: SolAmountInput) {
    return new this(parseBigNumber(lamports, true));
  }

  static fromSol(sol: SolAmountInput) {
    const lamports = parseBigNumber(sol).multipliedBy(LAMPORTS_PER_SOL);

    return new this(lamports);
  }

  static zero() {
    return this.fromLamports(0);
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
    return this.getSol().isEqualTo(parseBigNumber(other));
  }

  isLessThan(other: SolAmountInput): boolean {
    return this.getSol().isLessThan(parseBigNumber(other));
  }

  isLessThanOrEqualTo(other: SolAmountInput): boolean {
    return this.getSol().isLessThanOrEqualTo(parseBigNumber(other));
  }

  isGreaterThan(other: SolAmountInput): boolean {
    return this.getSol().isGreaterThan(parseBigNumber(other));
  }

  isGreaterThanOrEqualTo(other: SolAmountInput): boolean {
    return this.getSol().isGreaterThanOrEqualTo(parseBigNumber(other));
  }

  isNegative(): boolean {
    return this.getSol().isNegative();
  }

  isPositive(): boolean {
    return this.getSol().isPositive();
  }

  isZero(): boolean {
    return this.getSol().isZero();
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
    return SolAmount.fromSol(operation(this.getSol(), parseBigNumber(other)));
  }
}
