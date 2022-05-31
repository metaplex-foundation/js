import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';
import { Opaque } from '@/utils';
import { CurrencyMismatchError, UnexpectedCurrencyError } from '@/errors';

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

export const USD = {
  symbol: 'USD',
  decimals: 2,
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

export const sol = (sol: number): Amount => {
  return lamports(sol * LAMPORTS_PER_SOL);
};

export const usd = (usd: number): Amount => {
  return amount(usd * 100, USD);
};

export const toBasisPoints = (value: number | BN): BasisPoints => {
  return new BN(value) as BasisPoints;
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

export const assertCurrency = (
  actual: Currency | Amount,
  expected: Currency
) => {
  if ('currency' in actual) {
    actual = actual.currency;
  }

  if (!sameCurrencies(actual, expected)) {
    throw new UnexpectedCurrencyError(actual, expected);
  }
};

export const assertSol = (actual: Currency | Amount) => {
  assertCurrency(actual, SOL);
};

export const assertSameCurrencies = (
  left: Currency | Amount,
  right: Currency | Amount,
  operation?: string
) => {
  if ('currency' in left) {
    left = left.currency;
  }

  if ('currency' in right) {
    right = right.currency;
  }

  if (!sameCurrencies(left, right)) {
    throw new CurrencyMismatchError(left, right, operation);
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

export const formatAmount = (value: Amount): string => {
  const power = new BN(10).pow(new BN(value.currency.decimals));
  const basisPoints = value.basisPoints as unknown as BN & {
    divmod: (other: BN) => { div: BN; mod: BN };
  };

  const { div, mod } = basisPoints.divmod(power);
  const units = `${div.toString()}.${mod.abs().toString()}`;

  return `${value.currency.symbol} ${units}`;
};
