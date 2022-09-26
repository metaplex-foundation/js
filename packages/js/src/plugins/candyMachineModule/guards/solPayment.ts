import {
  createSerializerFromBeet,
  lamports,
  mapSerializer,
  PublicKey,
  SolAmount,
} from '@/types';
import {
  SolPayment,
  solPaymentBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { Buffer } from 'buffer';
import { CandyGuardManifest } from './core';

/** TODO */
export type SolPaymentGuardSettings = {
  amount: SolAmount;
  destination: PublicKey;
};

/** @internal */
export const solPaymentGuardManifest: CandyGuardManifest<SolPaymentGuardSettings> =
  {
    name: 'solPayment',
    settingsBytes: 40,
    settingsSerializer: mapSerializer<SolPayment, SolPaymentGuardSettings>(
      createSerializerFromBeet(solPaymentBeet),
      (settings) => ({ ...settings, amount: lamports(settings.lamports) }),
      (settings) => ({ ...settings, lamports: settings.amount.basisPoints })
    ),
    mintSettingsParser: ({ settings }) => {
      return {
        arguments: Buffer.from([]),
        remainingAccounts: [
          {
            isSigner: false,
            address: settings.destination,
            isWritable: true,
          },
        ],
      };
    },
  };
