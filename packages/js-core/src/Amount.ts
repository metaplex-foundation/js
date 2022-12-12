export type AmountIdentifier = 'SOL' | 'USD' | '%' | string;
export type AmountDecimals = number;
export type Amount<
  I extends AmountIdentifier = AmountIdentifier,
  D extends AmountDecimals = AmountDecimals
> = {
  /** The amount in its lower possible unit such that it does not contain decimals. */
  basisPoint: bigint;
  /** The identifier of the amount. */
  identifier: I;
  /** The number of decimals in the amount. */
  decimals: D;
};

export type SolAmount = Amount<'SOL', 9>;
export type UsdAmount = Amount<'USD', 2>;
export type PercentAmount<D extends AmountDecimals> = Amount<'%', D>;
