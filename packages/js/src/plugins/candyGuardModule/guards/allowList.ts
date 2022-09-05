import { createSerializerFromBeet } from '@/types';
import { AllowList, allowListBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type AllowListGuardSettings = AllowList;

/** @internal */
export const allowListGuardManifest: CandyGuardManifest<AllowList> = {
  name: 'allow_list',
  settingsBytes: 0, // TODO: set real value.
  settingsSerializer: createSerializerFromBeet(allowListBeet),
};
