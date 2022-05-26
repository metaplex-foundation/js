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
  namespace?: 'spl-token';
};

export const useSol = (sol: number): Amount => {
  return {
    basisPoints: toBasisPoints(sol * LAMPORTS_PER_SOL),
    currency: {
      symbol: 'SOL',
    },
  };
};

export const useLamports = (lamports: number | BN): Amount => {
  return {
    basisPoints: toBasisPoints(lamports),
    currency: {
      symbol: 'SOL',
    },
  };
};

export const toBasisPoints = (value: number | BN): BasisPoints => {
  return new BN(value, 'le') as BasisPoints;
};
