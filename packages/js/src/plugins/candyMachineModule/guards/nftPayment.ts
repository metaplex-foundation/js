import { createSerializerFromBeet } from '@/types';
import {
  NftPayment,
  nftPaymentBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/**
 * The nftPayment guard ...
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 *
 * @see {@link NftPaymentGuardMintSettings} for more
 * information on the mint settings of this guard.
 */
export type NftPaymentGuardSettings = NftPayment;

/**
 * The settings for the nftPayment guard that could
 * be provided when minting from the Candy Machine.
 *
 * @see {@link NftPaymentGuardSettings} for more
 * information on the nftPayment guard itself.
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
