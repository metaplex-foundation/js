import {
  createSerializerFromBeet,
  mapSerializer,
  PublicKey,
  Signer,
  SplTokenAmount,
  token,
} from '@/types';
import {
  TokenPayment,
  tokenPaymentBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { Buffer } from 'buffer';
import { GuardMitingSettingsMissingError } from '../errors';
import { CandyGuardManifest } from './core';

/**
 * The settings for the tokenPayment guard that should
 * be provided when creating and/or updating
 * a Candy Machine or a Candy Guard directly.
 */
export type TokenPaymentGuardSettings = {
  amount: SplTokenAmount;
  tokenMint: PublicKey;
  destinationAta: PublicKey;
};

/**
 * The settings for the tokenPayment guard that could
 * be provided when minting from the Candy Machine.
 */
export type TokenPaymentGuardMintSettings = {
  tokenOwner: Signer;
};

/** @internal */
export const tokenPaymentGuardManifest: CandyGuardManifest<
  TokenPaymentGuardSettings,
  TokenPaymentGuardMintSettings
> = {
  name: 'tokenPayment',
  settingsBytes: 72,
  settingsSerializer: mapSerializer<TokenPayment, TokenPaymentGuardSettings>(
    createSerializerFromBeet(tokenPaymentBeet),
    (settings) => ({ ...settings, amount: token(settings.amount) }),
    (settings) => ({ ...settings, amount: settings.amount.basisPoints })
  ),
  mintSettingsParser: ({ metaplex, settings, mintSettings, programs }) => {
    if (!mintSettings) {
      throw new GuardMitingSettingsMissingError('tokenPayment');
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
