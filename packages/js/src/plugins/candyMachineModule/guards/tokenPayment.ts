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
 * The tokenPayment guard ...
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 *
 * @see {@link TokenPaymentGuardMintSettings} for more
 * information on the mint settings of this guard.
 */
export type TokenPaymentGuardSettings = {
  amount: SplTokenAmount;
  tokenMint: PublicKey;
  destinationAta: PublicKey;
};

/**
 * The settings for the tokenPayment guard that could
 * be provided when minting from the Candy Machine.
 *
 * @see {@link TokenPaymentGuardSettings} for more
 * information on the tokenPayment guard itself.
 */
export type TokenPaymentGuardMintSettings = {
  tokenOwner: Signer; // TODO: Default to payer.
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
