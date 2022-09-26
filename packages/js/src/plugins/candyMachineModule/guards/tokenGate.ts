import {
  createSerializerFromBeet,
  mapSerializer,
  PublicKey,
  SplTokenAmount,
  token,
} from '@/types';
import { TokenGate, tokenGateBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type TokenGateGuardSettings = {
  mint: PublicKey;
  amount: SplTokenAmount;
};

/** @internal */
export const tokenGateGuardManifest: CandyGuardManifest<TokenGateGuardSettings> =
  {
    name: 'tokenGate',
    settingsBytes: 40,
    settingsSerializer: mapSerializer<TokenGate, TokenGateGuardSettings>(
      createSerializerFromBeet(tokenGateBeet),
      (settings) => ({ ...settings, amount: token(settings.amount) }),
      (settings) => ({ ...settings, amount: settings.amount.basisPoints })
    ),
  };
