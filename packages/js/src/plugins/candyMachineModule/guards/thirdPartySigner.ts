import { createSerializerFromBeet, Signer } from '@/types';
import {
  ThirdPartySigner,
  thirdPartySignerBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { Buffer } from 'buffer';
import { GuardMitingSettingsMissingError } from '../errors';
import { CandyGuardManifest } from './core';

/**
 * The settings for the thirdPartySigner guard that should
 * be provided when creating and/or updating
 * a Candy Machine or a Candy Guard directly.
 */
export type ThirdPartySignerGuardSettings = ThirdPartySigner;

/**
 * The settings for the thirdPartySigner guard that could
 * be provided when minting from the Candy Machine.
 */
export type ThirdPartySignerGuardMintSettings = {
  signer: Signer;
};

/** @internal */
export const thirdPartySignerGuardManifest: CandyGuardManifest<
  ThirdPartySignerGuardSettings,
  ThirdPartySignerGuardMintSettings
> = {
  name: 'thirdPartySigner',
  settingsBytes: 32,
  settingsSerializer: createSerializerFromBeet(thirdPartySignerBeet),
  mintSettingsParser: ({ mintSettings }) => {
    if (!mintSettings) {
      throw new GuardMitingSettingsMissingError('thirdPartySigner');
    }

    return {
      arguments: Buffer.from([]),
      remainingAccounts: [
        {
          isSigner: true,
          address: mintSettings.signer,
          isWritable: true,
        },
      ],
    };
  },
};
