import {
  createSerializerFromBeet,
  lamports,
  mapSerializer,
  SolAmount,
} from '@/types';
import { Lamports, lamportsBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type LamportsGuardSettings = {
  amount: SolAmount;
};

/** @internal */
export const lamportsGuardManifest: CandyGuardManifest<LamportsGuardSettings> =
  {
    name: 'lamports',
    settingsBytes: 8,
    settingsSerializer: mapSerializer<Lamports, LamportsGuardSettings>(
      createSerializerFromBeet(lamportsBeet),
      (settings) => ({ amount: lamports(settings.amount) }),
      (settings) => ({ amount: settings.amount.basisPoints })
    ),
  };
