import { createSerializerFromBeet } from '@/types';
import {
  NftPayment,
  nftPaymentBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type NftPaymentGuardSettings = NftPayment;

/** @internal */
export const nftPaymentGuardManifest: CandyGuardManifest<NftPaymentGuardSettings> =
  {
    name: 'nftPayment',
    settingsBytes: 64,
    settingsSerializer: createSerializerFromBeet(nftPaymentBeet),
  };
