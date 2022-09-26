import { createSerializerFromBeet, PublicKey } from '@/types';
import { NftBurn, nftBurnBeet } from '@metaplex-foundation/mpl-candy-guard';
import { GuardMitingSettingsMissingError } from '../errors';
import { CandyGuardManifest } from './core';

/** TODO */
export type NftBurnGuardSettings = NftBurn;

/** TODO */
export type NftBurnGuardMintSettings = {
  mint: PublicKey;
  tokenAccount?: PublicKey; // Defaults to ATA.
};

/** @internal */
export const nftBurnGuardManifest: CandyGuardManifest<
  NftBurnGuardSettings,
  NftBurnGuardMintSettings
> = {
  name: 'nftBurn',
  settingsBytes: 32,
  settingsSerializer: createSerializerFromBeet(nftBurnBeet),
  mintSettingsParser: ({
    metaplex,
    settings,
    mintSettings,
    payer,
    programs,
  }) => {
    if (!mintSettings) {
      throw new GuardMitingSettingsMissingError('nftBurn');
    }

    const tokenAccount =
      mintSettings.tokenAccount ??
      metaplex.tokens().pdas().associatedTokenAccount({
        mint: mintSettings.mint,
        owner: payer,
        programs,
      });

    const tokenMetadata = metaplex.nfts().pdas().metadata({
      mint: mintSettings.mint,
      programs,
    });

    const tokenEdition = metaplex.nfts().pdas().masterEdition({
      mint: mintSettings.mint,
      programs,
    });

    const mintCollectionMetadata = metaplex.nfts().pdas().metadata({
      mint: settings.requiredCollection,
      programs,
    });

    return {
      arguments: Buffer.from([]),
      remainingAccounts: [
        {
          isSigner: false,
          address: tokenAccount,
          isWritable: true,
        },
        {
          isSigner: false,
          address: tokenMetadata,
          isWritable: true,
        },
        {
          isSigner: false,
          address: tokenEdition,
          isWritable: true,
        },
        {
          isSigner: false,
          address: mintSettings.mint,
          isWritable: true,
        },
        {
          isSigner: false,
          address: mintCollectionMetadata,
          isWritable: true,
        },
      ],
    };
  },
};
