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

/**
 * The settings for the gatekeeper guard that should
 * be provided when creating and/or updating
 * a Candy Machine or a Candy Guard directly.
 */
export type GatekeeperGuardSettings = {
  /**
   * The public key of the Gatekeeper Network that will
   * be used to check the validity of the minting wallet.
   *
   * For instance, you may use the "Civic Captcha Pass" Network,
   * which ensures the minting wallet has passed a captcha, by using
   * the following address: `ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6`.
   */
  network: PublicKey;

  /**
   * Whether we should mark the Gateway Token of the minting wallet
   * as expired after the NFT has been minting.
   *
   * When set to `true`, they will need to go through the Gatekeeper
   * Network again in order to mint another NFT.
   *
   * When set to `false`, they will be able to mint another NFT
   * until the Gateway Token expires naturally.
   */
  expireOnUse: boolean;
};

/**
 * The settings for the gatekeeper guard that could
 * be provided when minting from the Candy Machine.
 */
export type GatekeeperGuardMintSettings = {
  /**
   * The Gateway Token PDA derived from the payer
   * and the Gatekeeper Network which is used to
   * verify the payer's eligibility to mint.
   *
   * @defaultValue
   * Computes the Gateway Token PDA using the payer's and the
   * Gatekeeper Network's public keys as well as the default
   * `seed` value which is `[0, 0, 0, 0, 0, 0, 0, 0]`.
   */
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
