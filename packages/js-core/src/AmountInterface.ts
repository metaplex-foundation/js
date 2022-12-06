import { Amount, AmountDecimals, AmountIdentifier } from './Amount';

export type AmountInput = number | string | Uint8Array;

export interface AmountInterface {
  create: <I extends AmountIdentifier, D extends AmountDecimals>(
    input: AmountInput,
    identifier: I,
    decimals: D,
    endian?: 'le' | 'be'
  ) => Amount<I, D>;
  add: <I extends AmountIdentifier, D extends AmountDecimals>(
    left: Amount<I, D>,
    right: Amount<I, D>
  ) => Amount<I, D>;
  subtract: <I extends AmountIdentifier, D extends AmountDecimals>(
    left: Amount<I, D>,
    right: Amount<I, D>
  ) => Amount<I, D>;
  multiply: <I extends AmountIdentifier, D extends AmountDecimals>(
    amount: Amount<I, D>,
    multiplier: number
  ) => Amount<I, D>;
  divide: <I extends AmountIdentifier, D extends AmountDecimals>(
    amount: Amount<I, D>,
    divisor: number
  ) => Amount<I, D>;
  absolute: <I extends AmountIdentifier, D extends AmountDecimals>(
    amount: Amount<I, D>
  ) => Amount<I, D>;
  compare: <I extends AmountIdentifier, D extends AmountDecimals>(
    left: Amount<I, D>,
    right: Amount<I, D>
  ) => -1 | 0 | 1;
  isEqual: <I extends AmountIdentifier, D extends AmountDecimals>(
    left: Amount<I, D>,
    right: Amount<I, D>,
    tolerance?: Amount<I, D>
  ) => boolean;
  isLessThan: <I extends AmountIdentifier, D extends AmountDecimals>(
    left: Amount<I, D>,
    right: Amount<I, D>
  ) => boolean;
  isLessThanOrEqualTo: <I extends AmountIdentifier, D extends AmountDecimals>(
    left: Amount<I, D>,
    right: Amount<I, D>
  ) => boolean;
  isGreaterThan: <I extends AmountIdentifier, D extends AmountDecimals>(
    left: Amount<I, D>,
    right: Amount<I, D>
  ) => boolean;
  isGreaterThanOrEqualTo: <
    I extends AmountIdentifier,
    D extends AmountDecimals
  >(
    left: Amount<I, D>,
    right: Amount<I, D>
  ) => boolean;
  isZero: (amount: Amount) => boolean;
  isPositive: (amount: Amount) => boolean;
  isNegative: (amount: Amount) => boolean;
  toNumber: (amount: Amount) => number;
  format: (amount: Amount) => string;
}
