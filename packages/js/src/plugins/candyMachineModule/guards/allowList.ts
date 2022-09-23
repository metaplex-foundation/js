import { createSerializerFromBeet, mapSerializer } from '@/types';
import { AllowList, allowListBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type AllowListGuardSettings = {
  merkleRoot: Uint8Array;
};

/** @internal */
export const allowListGuardManifest: CandyGuardManifest<AllowListGuardSettings> =
  {
    name: 'allowList',
    settingsBytes: 32,
    settingsSerializer: mapSerializer<AllowList, AllowListGuardSettings>(
      createSerializerFromBeet(allowListBeet),
      (settings) => ({ merkleRoot: new Uint8Array(settings.merkleRoot) }),
      (settings) => ({ merkleRoot: Array.from(settings.merkleRoot) })
    ),
  };
