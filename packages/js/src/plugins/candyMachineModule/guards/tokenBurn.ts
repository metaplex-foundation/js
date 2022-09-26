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

/** TODO */
export type TokenBurnGuardSettings = {
  amount: SplTokenAmount;
  mint: PublicKey;
};

/** TODO */
export type TokenBurnGuardMintSettings = {
  tokenBurnAuthority?: Signer;
  tokenAccount?: PublicKey;
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
    const tokenAccount =
      mintSettings?.tokenAccount ??
      metaplex.tokens().pdas().associatedTokenAccount({
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
          isWritable: false,
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
