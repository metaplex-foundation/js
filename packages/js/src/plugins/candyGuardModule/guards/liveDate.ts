import { createSerializerFromBeet } from '@/types';
import { Beet } from '@metaplex-foundation/beet';
import { LiveDate, liveDateBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type LiveDateGuardSettings = LiveDate;

/** @internal */
export const liveDateGuardManifest: CandyGuardManifest<LiveDate> = {
  name: 'live_date',
  settingsBytes: 0, // TODO: set real value.
  settingsSerializer: createSerializerFromBeet(liveDateBeet as Beet<LiveDate>),
};