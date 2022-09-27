import { createSerializerFromBeet, PublicKey } from '@/types';
import { nftPaymentBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/**
 * The nftPayment guard allows minting by charging the
 * payer an NFT from a specified NFT collection.
 * The NFT will be transfered to a predefined destination.
 *
 * This means the mint address of the NFT to transfer must be
 * passed when minting. This guard alone does not limit how many
 * times a holder can mint. A holder can mint as many times
 * as they have NFTs from the required collection to pay with.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 *
 * @see {@link NftPaymentGuardMintSettings} for more
 * information on the mint settings of this guard.
 */
export type NftPaymentGuardSettings = {
  /** TODO */
  requiredCollection: PublicKey;

  /** TODO */
  destinationAta: PublicKey;
};

/**
 * The settings for the nftPayment guard that could
 * be provided when minting from the Candy Machine.
 *
 * @see {@link NftPaymentGuardSettings} for more
 * information on the nftPayment guard itself.
 */
export type NftPaymentGuardMintSettings = {
  /** TODO */
};

/** @internal */
export const nftPaymentGuardManifest: CandyGuardManifest<
  NftPaymentGuardSettings,
  NftPaymentGuardMintSettings
> = {
  name: 'nftPayment',
  settingsBytes: 64,
  settingsSerializer: createSerializerFromBeet(nftPaymentBeet),
};
