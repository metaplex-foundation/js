import {
  createSerializerFromBeet,
  lamports,
  mapSerializer,
  PublicKey,
  SolAmount,
} from '@/types';
import { Lamports, lamportsBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type LamportsGuardSettings = {
  amount: SolAmount;
  destination: PublicKey;
};

/** @internal */
export const lamportsGuardManifest: CandyGuardManifest<LamportsGuardSettings> =
  {
    name: 'lamports',
    settingsBytes: 40,
    settingsSerializer: mapSerializer<Lamports, LamportsGuardSettings>(
      createSerializerFromBeet(lamportsBeet),
      (settings) => ({ ...settings, amount: lamports(settings.amount) }),
      (settings) => ({ ...settings, amount: settings.amount.basisPoints })
    ),
    mintSettingsParser: (mintSettings, setting) => {
      return {
        arguments: Buffer.from([]),
        remainingAccounts: [
          {
            isSigner: false,
            address: setting.destination,
            isWritable: true,
          },
        ],
      };
    },
  };
