import { createSerializerFromBeet } from '@/types';
import {
  NftPayment,
  nftPaymentBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/**
 * The settings for the nftPayment guard that should
 * be provided when creating and/or updating
 * a Candy Machine or a Candy Guard directly.
 */
export type NftPaymentGuardSettings = NftPayment;

/**
 * The settings for the nftPayment guard that could
 * be provided when minting from the Candy Machine.
 */
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
