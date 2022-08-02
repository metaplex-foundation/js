import { PublicKey } from '@solana/web3.js';
import { Signer } from './Signer';

export type Creator = Readonly<{
  address: PublicKey;
  verified: boolean;
  share: number;
}>;

export type CreatorInput = Readonly<{
  address: PublicKey;
  share: number;
  authority?: Signer;
}>;
