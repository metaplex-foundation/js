import {
  createSerializerFromBeet,
  mapSerializer,
  PublicKey,
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

/** @internal */
export const tokenBurnGuardManifest: CandyGuardManifest<TokenBurnGuardSettings> =
  {
    name: 'tokenBurn',
    settingsBytes: 40,
    settingsSerializer: mapSerializer<TokenBurn, TokenBurnGuardSettings>(
      createSerializerFromBeet(tokenBurnBeet),
      (settings) => ({ ...settings, amount: token(settings.amount) }),
      (settings) => ({ ...settings, amount: settings.amount.basisPoints })
    ),
  };
