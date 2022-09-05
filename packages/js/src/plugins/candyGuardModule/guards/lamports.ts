import { createSerializerFromBeet } from '@/types';
import { Lamports, lamportsBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type LamportsGuardSettings = Lamports;

/** @internal */
export const lamportsGuardManifest: CandyGuardManifest<Lamports> = {
  name: 'lamports',
  settingsBytes: 8,
  settingsSerializer: createSerializerFromBeet(lamportsBeet),
};
