import { createSerializerFromBeet, PublicKey } from '@/types';
import {
  Gatekeeper,
  gatekeeperBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { GuardMitingSettingsMissingError } from '../errors';
import { CandyGuardManifest, CandyGuardsMintRemainingAccount } from './core';

/** TODO */
export type GatekeeperGuardSettings = Gatekeeper;

/** TODO */
export type GatekeeperGuardMintSettings = {
  gatewayTokenAccount: PublicKey;
};

/** @internal */
export const gatekeeperGuardManifest: CandyGuardManifest<
  GatekeeperGuardSettings,
  GatekeeperGuardMintSettings
> = {
  name: 'gatekeeper',
  settingsBytes: 33,
  settingsSerializer: createSerializerFromBeet(gatekeeperBeet),
  mintSettingsParser: ({
    metaplex,
    settings,
    mintSettings,
    payer,
    programs,
  }) => {
    if (!mintSettings) {
      throw new GuardMitingSettingsMissingError('gatekeeper');
    }

    const remainingAccounts: CandyGuardsMintRemainingAccount[] = [
      {
        isSigner: false,
        address: tokenAccount,
        isWritable: true,
      },
    ];

    return {
      arguments: Buffer.from([]),
      remainingAccounts,
    };
  },
};
