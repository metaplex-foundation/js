import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';
import { Opaque } from '@/utils';

export type Amount = {
  basisPoints: BasisPoints;
  currency: Currency;
};

export type BasisPoints = Opaque<BN, 'BasisPoints'>;

export type Currency = {
  symbol: string;
  decimals: number;
  namespace?: 'spl-token';
};

export const SOL = {
  symbol: 'SOL',
  decimals: 9,
};

export const amount = (
  basisPoints: number | BN,
  currency: Currency
): Amount => {
  return {
    basisPoints: toBasisPoints(basisPoints),
    currency,
  };
};

export const lamports = (lamports: number | BN): Amount => {
  return amount(lamports, SOL);
};

export const sol = (sol: number | BN): Amount => {
  return lamports(toBasisPoints(sol).muln(LAMPORTS_PER_SOL));
};

export const toBasisPoints = (value: number | BN): BasisPoints => {
  return new BN(value, 'le') as BasisPoints;
};

export const isSol = (currencyOrAmount: Currency | Amount): boolean => {
  return sameCurrencies(currencyOrAmount, SOL);
};

export const sameCurrencies = (
  left: Currency | Amount,
  right: Currency | Amount
) => {
  if ('currency' in left) {
    left = left.currency;
  }

  if ('currency' in right) {
    right = right.currency;
  }

  return (
    left.symbol === right.symbol &&
    left.decimals === right.decimals &&
    left.namespace === right.namespace
  );
};

export const assertSameCurrencies = (
  left: Currency | Amount,
  right: Currency | Amount,
  operation?: string
) => {
  if (!sameCurrencies(left, right)) {
    // TODO: Custom errors.
    throw new Error(`Trying to ${operation} amounts with different currencies`);
  }
};

export const addAmounts = (left: Amount, right: Amount): Amount => {
  assertSameCurrencies(left, right, 'add');

  return amount(left.basisPoints.add(right.basisPoints), left.currency);
};

export const subtractAmounts = (left: Amount, right: Amount): Amount => {
  assertSameCurrencies(left, right, 'subtract');

  return amount(left.basisPoints.sub(right.basisPoints), left.currency);
};

export const multiplyAmount = (left: Amount, multiplier: number): Amount => {
  return amount(left.basisPoints.muln(multiplier), left.currency);
};

export const divideAmount = (left: Amount, divisor: number): Amount => {
  return amount(left.basisPoints.divn(divisor), left.currency);
};

export const compareAmounts = (left: Amount, right: Amount): -1 | 0 | 1 => {
  assertSameCurrencies(left, right, 'compare');

  return left.basisPoints.cmp(right.basisPoints);
};

export const isEqualToAmount = (left: Amount, right: Amount): boolean =>
  compareAmounts(left, right) === 0;

export const isLessThanAmount = (left: Amount, right: Amount): boolean =>
  compareAmounts(left, right) < 0;

export const isLessThanOrEqualToAmount = (
  left: Amount,
  right: Amount
): boolean => compareAmounts(left, right) <= 0;

export const isGreaterThanAmount = (left: Amount, right: Amount): boolean =>
  compareAmounts(left, right) > 0;

export const isGreaterThanOrEqualToAmount = (
  left: Amount,
  right: Amount
): boolean => compareAmounts(left, right) >= 0;

export const isZeroAmount = (value: Amount): boolean =>
  compareAmounts(value, amount(0, value.currency)) === 0;

export const isPositiveAmount = (value: Amount): boolean =>
  compareAmounts(value, amount(0, value.currency)) >= 0;

export const isNegativeAmount = (value: Amount): boolean =>
  compareAmounts(value, amount(0, value.currency)) < 0;
