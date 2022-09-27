import {
  createSerializerFromBeet,
  mapSerializer,
  PublicKey,
  Signer,
  SplTokenAmount,
  token,
} from '@/types';
import { TokenBurn, tokenBurnBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/**
 * The tokenBurn guard ...
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 *
 * @see {@link TokenBurnGuardMintSettings} for more
 * information on the mint settings of this guard.
 */
export type TokenBurnGuardSettings = {
  amount: SplTokenAmount;
  mint: PublicKey;
};

/**
 * The settings for the tokenBurn guard that could
 * be provided when minting from the Candy Machine.
 *
 * @see {@link TokenBurnGuardSettings} for more
 * information on the tokenBurn guard itself.
 */
export type TokenBurnGuardMintSettings = {
  tokenBurnAuthority?: Signer;
};

/** @internal */
export const tokenBurnGuardManifest: CandyGuardManifest<
  TokenBurnGuardSettings,
  TokenBurnGuardMintSettings
> = {
  name: 'tokenBurn',
  settingsBytes: 40,
  settingsSerializer: mapSerializer<TokenBurn, TokenBurnGuardSettings>(
    createSerializerFromBeet(tokenBurnBeet),
    (settings) => ({ ...settings, amount: token(settings.amount) }),
    (settings) => ({ ...settings, amount: settings.amount.basisPoints })
  ),
  mintSettingsParser: ({
    metaplex,
    settings,
    mintSettings,
    payer,
    programs,
  }) => {
    const tokenBurnAuthority = mintSettings?.tokenBurnAuthority ?? payer;
    const tokenAccount = metaplex.tokens().pdas().associatedTokenAccount({
      mint: settings.mint,
      owner: payer.publicKey,
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
          address: settings.mint,
          isWritable: true,
        },
        {
          isSigner: true,
          address: tokenBurnAuthority,
          isWritable: false,
        },
      ],
    };
  },
};
