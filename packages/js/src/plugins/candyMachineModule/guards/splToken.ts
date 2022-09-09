import {
  createSerializerFromBeet,
  mapSerializer,
  PublicKey,
  SplTokenAmount,
  token,
} from '@/types';
import { SplToken, splTokenBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type SplTokenGuardSettings = {
  amount: SplTokenAmount;
  tokenMint: PublicKey;
  destinationAta: PublicKey;
};

/** @internal */
export const splTokenGuardManifest: CandyGuardManifest<SplTokenGuardSettings> =
  {
    name: 'splToken',
    settingsBytes: 72,
    settingsSerializer: mapSerializer<SplToken, SplTokenGuardSettings>(
      createSerializerFromBeet(splTokenBeet),
      (settings) => ({ ...settings, amount: token(settings.amount) }),
      (settings) => ({ ...settings, amount: settings.amount.basisPoints })
    ),
  };
