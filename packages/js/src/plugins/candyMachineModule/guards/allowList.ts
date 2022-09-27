import { createSerializerFromBeet, mapSerializer } from '@/types';
import * as beet from '@metaplex-foundation/beet';
import { AllowList, allowListBeet } from '@metaplex-foundation/mpl-candy-guard';
import { Buffer } from 'buffer';
import { GuardMitingSettingsMissingError } from '../errors';
import { CandyGuardManifest } from './core';

/**
 * The allowList guard ...
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 *
 * @see {@link AllowListGuardMintSettings} for more
 * information on the mint settings of this guard.
 */
export type AllowListGuardSettings = {
  merkleRoot: Uint8Array;
};

/**
 * The settings for the allowList guard that could
 * be provided when minting from the Candy Machine.
 *
 * @see {@link AllowListGuardSettings} for more
 * information on the allowList guard itself.
 */
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

    const proof = mintSettings.merkleProof;
    const vectorSize = Buffer.alloc(4);
    beet.u32.write(vectorSize, 0, proof.length);

    return {
      arguments: Buffer.concat([vectorSize, ...proof]),
      remainingAccounts: [],
    };
  },
};
