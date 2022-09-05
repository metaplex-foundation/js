import { createSerializerFromBeet } from '@/types';
import { SplToken, splTokenBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type SplTokenGuardSettings = SplToken;

/** @internal */
export const splTokenGuardManifest: CandyGuardManifest<SplToken> = {
  name: 'splToken',
  settingsBytes: 40,
  settingsSerializer: createSerializerFromBeet(splTokenBeet),
};
