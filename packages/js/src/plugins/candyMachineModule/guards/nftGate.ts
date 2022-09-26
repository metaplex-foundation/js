import { createSerializerFromBeet } from '@/types';
import { NftGate, nftGateBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type NftGateGuardSettings = NftGate;

/** @internal */
export const nftGateGuardManifest: CandyGuardManifest<NftGateGuardSettings> = {
  name: 'nftGate',
  settingsBytes: 32,
  settingsSerializer: createSerializerFromBeet(nftGateBeet),
};
