import { createSerializerFromBeet } from '@/types';
import { NftBurn, nftBurnBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type NftBurnGuardSettings = NftBurn;

/** @internal */
export const nftBurnGuardManifest: CandyGuardManifest<NftBurnGuardSettings> = {
  name: 'nftBurn',
  settingsBytes: 32,
  settingsSerializer: createSerializerFromBeet(nftBurnBeet),
};
