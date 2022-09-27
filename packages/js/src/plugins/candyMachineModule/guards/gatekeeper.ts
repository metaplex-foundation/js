import { createSerializerFromBeet, mapSerializer, PublicKey } from '@/types';
import {
  Gatekeeper,
  gatekeeperBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import {
  GatekeeperGuardRequiresExpireAccountError,
  GuardMitingSettingsMissingError,
} from '../errors';
import { CandyGuardManifest, CandyGuardsMintRemainingAccount } from './core';

/** TODO */
export type GatekeeperGuardSettings = {
  network: PublicKey;
  expireOnUse: boolean;
};

/** TODO */
export type GatekeeperGuardMintSettings = {
  tokenAccount: PublicKey;
  expireAccount?: PublicKey;
};

/** @internal */
export const gatekeeperGuardManifest: CandyGuardManifest<
  GatekeeperGuardSettings,
  GatekeeperGuardMintSettings
> = {
  name: 'gatekeeper',
  settingsBytes: 33,
  settingsSerializer: mapSerializer<Gatekeeper, GatekeeperGuardSettings>(
    createSerializerFromBeet(gatekeeperBeet),
    (settings) => ({ ...settings, network: settings.gatekeeperNetwork }),
    (settings) => ({ ...settings, gatekeeperNetwork: settings.network })
  ),
  mintSettingsParser: ({ metaplex, settings, mintSettings, programs }) => {
    if (!mintSettings) {
      throw new GuardMitingSettingsMissingError('gatekeeper');
    }

    const remainingAccounts: CandyGuardsMintRemainingAccount[] = [
      {
        isSigner: false,
        address: mintSettings.tokenAccount,
        isWritable: true,
      },
    ];

    if (settings.expireOnUse) {
      if (!mintSettings.expireAccount) {
        throw new GatekeeperGuardRequiresExpireAccountError();
      }

      remainingAccounts.push({
        isSigner: false,
        address: metaplex.programs().get('GatewayProgram', programs).address,
        isWritable: false,
      });
      remainingAccounts.push({
        isSigner: false,
        address: mintSettings.expireAccount,
        isWritable: true,
      });
    }

    return {
      arguments: Buffer.from([]),
      remainingAccounts,
    };
  },
};
