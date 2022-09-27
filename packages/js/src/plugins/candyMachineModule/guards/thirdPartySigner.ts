import { createSerializerFromBeet, Signer } from '@/types';
import {
  ThirdPartySigner,
  thirdPartySignerBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { Buffer } from 'buffer';
import { GuardMitingSettingsMissingError } from '../errors';
import { CandyGuardManifest } from './core';

/**
 * The thirdPartySigner guard ...
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 *
 * @see {@link ThirdPartySignerGuardMintSettings} for more
 * information on the mint settings of this guard.
 */
export type ThirdPartySignerGuardSettings = ThirdPartySigner;

/**
 * The settings for the thirdPartySigner guard that could
 * be provided when minting from the Candy Machine.
 *
 * @see {@link ThirdPartySignerGuardSettings} for more
 * information on the thirdPartySigner guard itself.
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
