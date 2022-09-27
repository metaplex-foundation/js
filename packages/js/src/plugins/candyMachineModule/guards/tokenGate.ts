import {
  createSerializerFromBeet,
  mapSerializer,
  PublicKey,
  SplTokenAmount,
  token,
} from '@/types';
import { TokenGate, tokenGateBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/**
 * The settings for the tokenGate guard that should
 * be provided when creating and/or updating
 * a Candy Machine or a Candy Guard directly.
 */
export type TokenGateGuardSettings = {
  mint: PublicKey;
  amount: SplTokenAmount;
};

/**
 * The settings for the tokenGate guard that could
 * be provided when minting from the Candy Machine.
 */
export type TokenGateGuardMintSettings = {
  tokenAccount?: PublicKey;
};

/** @internal */
export const tokenGateGuardManifest: CandyGuardManifest<
  TokenGateGuardSettings,
  TokenGateGuardMintSettings
> = {
  name: 'tokenGate',
  settingsBytes: 40,
  settingsSerializer: mapSerializer<TokenGate, TokenGateGuardSettings>(
    createSerializerFromBeet(tokenGateBeet),
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
          isWritable: false,
        },
      ],
    };
  },
};
