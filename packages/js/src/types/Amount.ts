import { AmountMismatchError, UnexpectedAmountError } from '@/errors';

const LAMPORTS_PER_SOL = 1_000_000_000;
export type BigIntInput = number | string | boolean | bigint | Uint8Array;
export type AmountIdentifier = 'SOL' | 'USD' | '%' | string;
export type AmountDecimals = number;
export type Amount<
  I extends AmountIdentifier = AmountIdentifier,
  D extends AmountDecimals = AmountDecimals
> = {
  /** The amount in its lower possible unit such that it does not contain decimals. */
  basisPoints: bigint;
  /** The identifier of the amount. */
  identifier: I;
  /** The number of decimals in the amount. */
  decimals: D;
};

export type SolAmount = Amount<'SOL', 9>;
export type UsdAmount = Amount<'USD', 2>;
export type PercentAmount<D extends AmountDecimals> = Amount<'%', D>;

export const toBigInt = (input: BigIntInput): bigint => {
  input = typeof input === 'object' ? input.toString() : input;
  return BigInt(input);
};

export const amount = <I extends AmountIdentifier, D extends AmountDecimals>(
  basisPoints: BigIntInput,
  identifier: I,
  decimals: D
): Amount<I, D> => {
  return {
    basisPoints: toBigInt(basisPoints),
    identifier,
    decimals,
  };
};

export const lamports = (lamports: BigIntInput): SolAmount => {
  return amount(lamports, 'SOL', 9);
};

export const sol = (sol: number): SolAmount => {
  // TODO(loris): multiply after converting to bigint.
  return lamports(sol * LAMPORTS_PER_SOL);
};

export const usd = (usd: number): UsdAmount => {
  // TODO(loris): multiply after converting to bigint.
  return amount(usd * 100, 'USD', 2);
};

export const token = <I extends AmountIdentifier, D extends AmountDecimals>(
  tokens: number,
  identifier?: I,
  decimals?: D
): Amount<I, D> => {
  // TODO(loris): multiply after converting to bigint.
  return amount(
    tokens * Math.pow(10, decimals ?? 0),
    (identifier ?? 'Token') as I,
    (decimals ?? 0) as D
  );
};

export const isAmount = <I extends AmountIdentifier, D extends AmountDecimals>(
  amount: Amount,
  identifier: I,
  decimals: D
): amount is Amount<I, D> => {
  return amount.identifier === identifier && amount.decimals === decimals;
};

export const isSolAmount = (amount: Amount): amount is SolAmount => {
  return isAmount(amount, 'SOL', 9);
};

export const sameAmounts = (left: Amount, right: Amount): boolean => {
  return isAmount(left, right.identifier, right.decimals);
};

export function assertAmount<
  I extends AmountIdentifier,
  D extends AmountDecimals
>(amount: Amount, identifier: I, decimals: D): asserts amount is Amount<I, D> {
  if (!isAmount(amount, identifier, decimals)) {
    throw new UnexpectedAmountError(amount, identifier, decimals);
  }
}

export function assertSolAmount(actual: Amount): asserts actual is SolAmount {
  assertAmount(actual, 'SOL', 9);
}

export function assertSameAmounts(
  left: Amount,
  right: Amount,
  operation?: string
) {
  if (!sameAmounts(left, right)) {
    throw new AmountMismatchError(left, right, operation);
  }
}

export const addAmounts = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  left: Amount<I, D>,
  right: Amount<I, D>
): Amount<I, D> => {
  assertSameAmounts(left, right, 'add');

  return {
    ...left,
    basisPoints: left.basisPoints + right.basisPoints,
  };
};

export const subtractAmounts = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  left: Amount<I, D>,
  right: Amount<I, D>
): Amount<I, D> => {
  assertSameAmounts(left, right, 'subtract');

  return {
    ...left,
    basisPoints: left.basisPoints - right.basisPoints,
  };
};

export const multiplyAmount = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  left: Amount<I, D>,
  multiplier: number | bigint
): Amount<I, D> => {
  return {
    ...left,
    basisPoints: left.basisPoints * BigInt(multiplier),
  };
};

export const divideAmount = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  left: Amount<I, D>,
  divisor: number
): Amount<I, D> => {
  return amount(left.basisPoints.divn(divisor), left.currency);
};

export const absoluteAmount = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  value: Amount<I, D>
): Amount<I, D> => {
  return amount(value.basisPoints.abs(), value.currency);
};

export const compareAmounts = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  left: Amount<I, D>,
  right: Amount<I, D>
): -1 | 0 | 1 => {
  assertSameAmounts(left, right, 'compare');

  return left.basisPoints.cmp(right.basisPoints);
};

export const isEqualToAmount = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  left: Amount<I, D>,
  right: Amount<I, D>,
  tolerance?: Amount<I, D>
): boolean => {
  tolerance = tolerance ?? amount(0, left.currency);
  assertSameAmounts(left, right, 'isEqualToAmount');
  assertSameAmounts(left, tolerance, 'isEqualToAmount');

  const delta = absoluteAmount(subtractAmounts(left, right));

  return isLessThanOrEqualToAmount(delta, tolerance);
};

export const isLessThanAmount = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  left: Amount<I, D>,
  right: Amount<I, D>
): boolean => compareAmounts(left, right) < 0;

export const isLessThanOrEqualToAmount = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  left: Amount<I, D>,
  right: Amount<I, D>
): boolean => compareAmounts(left, right) <= 0;

export const isGreaterThanAmount = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  left: Amount<I, D>,
  right: Amount<I, D>
): boolean => compareAmounts(left, right) > 0;

export const isGreaterThanOrEqualToAmount = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  left: Amount<I, D>,
  right: Amount<I, D>
): boolean => compareAmounts(left, right) >= 0;

export const isZeroAmount = (value: Amount): boolean =>
  compareAmounts(value, amount(0, value.currency)) === 0;

export const isPositiveAmount = (value: Amount): boolean =>
  compareAmounts(value, amount(0, value.currency)) >= 0;

export const isNegativeAmount = (value: Amount): boolean =>
  compareAmounts(value, amount(0, value.currency)) < 0;

export const formatAmount = (value: Amount): string => {
  if (value.currency.decimals === 0) {
    return `${value.currency.symbol} ${value.basisPoints.toString()}`;
  }

  const power = new BN(10).pow(new BN(value.currency.decimals));
  const basisPoints = value.basisPoints as unknown as BN & {
    divmod: (other: BN) => { div: BN; mod: BN };
  };

  const { div, mod } = basisPoints.divmod(power);
  const units = `${div.toString()}.${mod
    .abs()
    .toString(10, value.currency.decimals)}`;

  return `${value.currency.symbol} ${units}`;
};
