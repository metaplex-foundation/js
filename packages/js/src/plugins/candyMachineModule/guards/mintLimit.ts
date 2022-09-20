import { createSerializerFromBeet } from '@/types';
import { MintLimit, mintLimitBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type MintLimitGuardSettings = MintLimit;

/** @internal */
export const mintLimitGuardManifest: CandyGuardManifest<MintLimitGuardSettings> =
  {
    name: 'mintLimit',
    settingsBytes: 3,
    settingsSerializer: createSerializerFromBeet(mintLimitBeet),
  };
