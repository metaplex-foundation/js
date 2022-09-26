import { createSerializerFromBeet } from '@/types';
import {
  NftPayment,
  nftPaymentBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type NftPaymentGuardSettings = NftPayment;

/** TODO */
export type NftPaymentGuardMintSettings = {};

/** @internal */
export const nftPaymentGuardManifest: CandyGuardManifest<
  NftPaymentGuardSettings,
  NftPaymentGuardMintSettings
> = {
  name: 'nftPayment',
  settingsBytes: 64,
  settingsSerializer: createSerializerFromBeet(nftPaymentBeet),
};
