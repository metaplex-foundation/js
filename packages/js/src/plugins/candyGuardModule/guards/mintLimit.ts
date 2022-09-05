import { createSerializerFromBeet } from '@/types';
import { MintLimit, mintLimitBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type MintLimitGuardSettings = MintLimit;

/** @internal */
export const mintLimitGuardManifest: CandyGuardManifest<MintLimit> = {
  name: 'mint_limit',
  settingsBytes: 0, // TODO: set real value.
  settingsSerializer: createSerializerFromBeet(mintLimitBeet),
};
