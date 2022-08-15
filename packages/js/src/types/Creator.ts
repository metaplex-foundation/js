import { PublicKey } from '@solana/web3.js';
import { Signer } from './Signer';

export type Creator = {
  readonly address: PublicKey;
  readonly verified: boolean;
  readonly share: number;
};

export type CreatorInput = {
  readonly address: PublicKey;
  readonly share: number;
  readonly authority?: Signer;
};
