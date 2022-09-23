import { createSerializerFromBeet, mapSerializer } from '@/types';
import { AllowList, allowListBeet } from '@metaplex-foundation/mpl-candy-guard';
import { Buffer } from 'buffer';
import { GuardMitingSettingsMissingError } from '../errors';
import { CandyGuardManifest } from './core';

/** TODO */
export type AllowListGuardSettings = {
  merkleRoot: Uint8Array;
};

/** TODO */
export type AllowListGuardMintSettings = {
  merkleProof: Uint8Array[];
};

/** @internal */
export const allowListGuardManifest: CandyGuardManifest<
  AllowListGuardSettings,
  AllowListGuardMintSettings
> = {
  name: 'allowList',
  settingsBytes: 32,
  settingsSerializer: mapSerializer<AllowList, AllowListGuardSettings>(
    createSerializerFromBeet(allowListBeet),
    (settings) => ({ merkleRoot: new Uint8Array(settings.merkleRoot) }),
    (settings) => ({ merkleRoot: Array.from(settings.merkleRoot) })
  ),
  mintSettingsParser: ({ mintSettings }) => {
    if (!mintSettings) {
      throw new GuardMitingSettingsMissingError('allowList');
    }

    return {
      arguments: Buffer.concat(mintSettings.merkleProof),
      remainingAccounts: [],
    };
  },
};
