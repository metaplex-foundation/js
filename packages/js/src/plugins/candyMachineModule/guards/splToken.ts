import {
  createSerializerFromBeet,
  mapSerializer,
  PublicKey,
  Signer,
  SplTokenAmount,
  token,
} from '@/types';
import { SplToken, splTokenBeet } from '@metaplex-foundation/mpl-candy-guard';
import { Buffer } from 'buffer';
import { GuardMitingSettingsMissingError } from '../errors';
import { CandyGuardManifest } from './core';

/** TODO */
export type SplTokenGuardSettings = {
  amount: SplTokenAmount;
  tokenMint: PublicKey;
  destinationAta: PublicKey;
};

/** TODO */
export type SplTokenGuardMintSettings = {
  tokenOwner: Signer;
};

/** @internal */
export const splTokenGuardManifest: CandyGuardManifest<
  SplTokenGuardSettings,
  SplTokenGuardMintSettings
> = {
  name: 'splToken',
  settingsBytes: 72,
  settingsSerializer: mapSerializer<SplToken, SplTokenGuardSettings>(
    createSerializerFromBeet(splTokenBeet),
    (settings) => ({ ...settings, amount: token(settings.amount) }),
    (settings) => ({ ...settings, amount: settings.amount.basisPoints })
  ),
  mintSettingsParser: ({ metaplex, settings, mintSettings, programs }) => {
    if (!mintSettings) {
      throw new GuardMitingSettingsMissingError('splToken');
    }

    const tokenAddress = metaplex.tokens().pdas().associatedTokenAccount({
      mint: settings.tokenMint,
      owner: mintSettings.tokenOwner.publicKey,
      programs,
    });

    return {
      arguments: Buffer.from([]),
      remainingAccounts: [
        {
          isSigner: false,
          address: tokenAddress,
          isWritable: true,
        },
        {
          isSigner: true,
          address: mintSettings.tokenOwner,
          isWritable: false,
        },
        {
          isSigner: false,
          address: settings.destinationAta,
          isWritable: true,
        },
      ],
    };
  },
};
