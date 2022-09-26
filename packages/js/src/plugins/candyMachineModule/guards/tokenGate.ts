import { createSerializerFromBeet, mapSerializer, PublicKey } from '@/types';
import { TokenGate, tokenGateBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type TokenGateGuardSettings = {
  mint: PublicKey;
  burn: boolean;
};

/** @internal */
export const tokenGateGuardManifest: CandyGuardManifest<TokenGateGuardSettings> =
  {
    name: 'tokenGate',
    settingsBytes: 33,
    settingsSerializer: mapSerializer<TokenGate, TokenGateGuardSettings>(
      createSerializerFromBeet(tokenGateBeet),
      (settings) => ({ ...settings }),
      (settings) => ({ ...settings })
    ),
  };
