import {
  createSerializerFromBeet,
  mapSerializer,
  Pda,
  PublicKey,
} from '@/types';
import {
  Gatekeeper,
  gatekeeperBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { Buffer } from 'buffer';
import { CandyGuardManifest, CandyGuardsMintRemainingAccount } from './core';

/** TODO */
export type GatekeeperGuardSettings = {
  network: PublicKey;
  expireOnUse: boolean;
};

/** TODO */
export type GatekeeperGuardMintSettings = {
  tokenAccount?: PublicKey;
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
  mintSettingsParser: ({
    metaplex,
    settings,
    mintSettings,
    payer,
    programs,
  }) => {
    const gatewayProgram = metaplex.programs().getGateway(programs);
    const tokenAccount =
      mintSettings?.tokenAccount ??
      Pda.find(gatewayProgram.address, [
        payer.publicKey.toBuffer(),
        Buffer.from('gateway'),
        Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
        settings.network.toBuffer(),
      ]);

    const remainingAccounts: CandyGuardsMintRemainingAccount[] = [
      {
        isSigner: false,
        address: tokenAccount,
        isWritable: true,
      },
    ];

    if (settings.expireOnUse) {
      const expireAccount = Pda.find(gatewayProgram.address, [
        settings.network.toBuffer(),
        Buffer.from('expire'),
      ]);

      remainingAccounts.push({
        isSigner: false,
        address: gatewayProgram.address,
        isWritable: false,
      });
      remainingAccounts.push({
        isSigner: false,
        address: expireAccount,
        isWritable: false,
      });
    }

    return {
      arguments: Buffer.from([]),
      remainingAccounts,
    };
  },
};
