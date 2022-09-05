import { createSerializerFromBeet } from '@/types';
import { SplToken, splTokenBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type SplTokenGuardSettings = SplToken;

/** @internal */
export const splTokenGuardManifest: CandyGuardManifest<SplToken> = {
  name: 'spl_token',
  settingsBytes: 40,
  settingsSerializer: createSerializerFromBeet(splTokenBeet),
};
