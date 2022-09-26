import { createSerializerFromBeet, PublicKey } from '@/types';
import { NftGate, nftGateBeet } from '@metaplex-foundation/mpl-candy-guard';
import { GuardMitingSettingsMissingError } from '../errors';
import { CandyGuardManifest } from './core';

/** TODO */
export type NftGateGuardSettings = NftGate;

/** TODO */
export type NftGateGuardMintSettings = {
  mint: PublicKey;
  tokenAccount?: PublicKey; // Defaults to ATA.
};

/** @internal */
export const nftGateGuardManifest: CandyGuardManifest<
  NftGateGuardSettings,
  NftGateGuardMintSettings
> = {
  name: 'nftGate',
  settingsBytes: 32,
  settingsSerializer: createSerializerFromBeet(nftGateBeet),
  mintSettingsParser: ({ metaplex, mintSettings, payer, programs }) => {
    if (!mintSettings) {
      throw new GuardMitingSettingsMissingError('nftGate');
    }

    const tokenAccount =
      mintSettings.tokenAccount ??
      metaplex.tokens().pdas().associatedTokenAccount({
        mint: mintSettings.mint,
        owner: payer.publicKey,
        programs,
      });

    const tokenMetadata = metaplex.nfts().pdas().metadata({
      mint: mintSettings.mint,
      programs,
    });

    return {
      arguments: Buffer.from([]),
      remainingAccounts: [
        {
          isSigner: false,
          address: tokenAccount,
          isWritable: false,
        },
        {
          isSigner: false,
          address: tokenMetadata,
          isWritable: false,
        },
      ],
    };
  },
};
