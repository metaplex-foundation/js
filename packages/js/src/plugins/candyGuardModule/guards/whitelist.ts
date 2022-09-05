import { createSerializerFromBeet } from '@/types';
import { Beet } from '@metaplex-foundation/beet';
import { Whitelist, whitelistBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type WhitelistGuardSettings = Whitelist;

/** @internal */
export const whitelistGuardManifest: CandyGuardManifest<Whitelist> = {
  name: 'whitelist',
  settingsBytes: 0, // TODO: set real value.
  settingsSerializer: createSerializerFromBeet(
    whitelistBeet as Beet<Whitelist>
  ),
};
