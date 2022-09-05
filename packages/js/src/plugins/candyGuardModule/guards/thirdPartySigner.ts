import { createSerializerFromBeet } from '@/types';
import {
  ThirdPartySigner,
  thirdPartySignerBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type ThirdPartySignerGuardSettings = ThirdPartySigner;

/** @internal */
export const thirdPartySignerGuardManifest: CandyGuardManifest<ThirdPartySigner> =
  {
    name: 'third_party_signer',
    settingsBytes: 0, // TODO: set real value.
    settingsSerializer: createSerializerFromBeet(thirdPartySignerBeet),
  };