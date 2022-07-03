import type { Buffer } from 'buffer';
import BN from 'bn.js';
import { Opaque } from '@/utils';

export type BigNumber = Opaque<BN, 'BigNumber'>;
export type BigNumberValues =
  | number
  | string
  | number[]
  | Uint8Array
  | Buffer
  | BN;

export const toBigNumber = (value: BigNumberValues): BigNumber => {
  return new BN(value) as BigNumber;
};
