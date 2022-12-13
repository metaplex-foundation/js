import { AmountMismatchError, UnexpectedAmountError } from '@/errors';

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

export const toAmount = <I extends AmountIdentifier, D extends AmountDecimals>(
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
  return toAmount(lamports, 'SOL', 9);
};

const LAMPORTS_PER_SOL = 1_000_000_000;
export const sol = (sol: number): SolAmount => {
  return multiplyAmount(lamports(LAMPORTS_PER_SOL), sol);
};

export const usd = (usd: number): UsdAmount => {
  return multiplyAmount(toAmount(100, 'USD', 2), usd);
};

export const toTokenAmount = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  tokens: number,
  identifier?: I,
  decimals?: D
): Amount<I, D> => {
  const exponentAmount = toAmount(
    BigInt(10) ** BigInt(decimals ?? 0),
    (identifier ?? 'Token') as I,
    (decimals ?? 0) as D
  );

  return multiplyAmount(exponentAmount, tokens);
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
  if (typeof multiplier === 'bigint') {
    return { ...left, basisPoints: left.basisPoints * multiplier };
  }

  const [units, decimals] = multiplier.toString().split('.');
  const multiplierBasisPoints = BigInt(units + (decimals ?? ''));
  const multiplierExponents = BigInt(10) ** BigInt(decimals?.length ?? 0);

  return {
    ...left,
    basisPoints:
      (left.basisPoints * multiplierBasisPoints) / multiplierExponents,
  };
};

export const divideAmount = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  left: Amount<I, D>,
  divisor: number | bigint
): Amount<I, D> => {
  if (typeof divisor === 'bigint') {
    return { ...left, basisPoints: left.basisPoints / divisor };
  }

  const [units, decimals] = divisor.toString().split('.');
  const divisorBasisPoints = BigInt(units + (decimals ?? ''));
  const divisorExponents = BigInt(10) ** BigInt(decimals?.length ?? 0);

  return {
    ...left,
    basisPoints: (left.basisPoints * divisorExponents) / divisorBasisPoints,
  };
};

export const absoluteAmount = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  value: Amount<I, D>
): Amount<I, D> => {
  const x = value.basisPoints;
  return { ...value, basisPoints: x < 0 ? -x : x };
};

export const compareAmounts = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  left: Amount<I, D>,
  right: Amount<I, D>
): -1 | 0 | 1 => {
  assertSameAmounts(left, right, 'compare');
  if (left.basisPoints > right.basisPoints) return 1;
  if (left.basisPoints < right.basisPoints) return -1;
  return 0;
};

export const isEqualToAmount = <
  I extends AmountIdentifier,
  D extends AmountDecimals
>(
  left: Amount<I, D>,
  right: Amount<I, D>,
  tolerance?: Amount<I, D>
): boolean => {
  tolerance = tolerance ?? toAmount(0, left.identifier, left.decimals);
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
  value.basisPoints === BigInt(0);

export const isPositiveAmount = (value: Amount): boolean =>
  value.basisPoints >= BigInt(0);

export const isNegativeAmount = (value: Amount): boolean =>
  value.basisPoints < BigInt(0);

export const amountToString = (value: Amount, maxDecimals?: number): string => {
  let text = value.basisPoints.toString();
  if (value.decimals === 0) {
    return text;
  }

  const sign = text.startsWith('-') ? '-' : '';
  text = text.replace('-', '');
  text = text.padStart(value.decimals + 1, '0');
  const units = text.slice(0, -value.decimals);
  let decimals = text.slice(-value.decimals);

  if (maxDecimals !== undefined) {
    decimals = decimals.slice(0, maxDecimals);
  }

  return sign + units + '.' + decimals;
};

export const amountToNumber = (value: Amount): number => {
  return parseFloat(amountToString(value));
};

export const formatAmount = (value: Amount, maxDecimals?: number): string => {
  const amountAsString = amountToString(value, maxDecimals);

  switch (value.identifier) {
    case '%':
      return `${amountAsString} %`;
    default:
      return `${value.identifier} ${amountAsString}`;
  }
};

/** @deprecated Use `toAmount` instead. */
export const amount = toAmount;

/** @deprecated Use `toTokenAmount` instead. */
export const token = toTokenAmount;

/** @deprecated Use `isSolAmount` instead. */
export const isSol = isSolAmount;

/** @deprecated Use `assertSolAmount` instead. */
export const assertSol = assertSolAmount;
