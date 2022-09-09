import { createSerializerFromBeet, PublicKey } from '@/types';
import { nftPaymentBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type NftPaymentGuardSettings = {
  burn: boolean;
  requiredCollection: PublicKey;
};

/** @internal */
export const nftPaymentGuardManifest: CandyGuardManifest<NftPaymentGuardSettings> =
  {
    name: 'nftPayment',
    settingsBytes: 33,
    settingsSerializer: createSerializerFromBeet(nftPaymentBeet),
  };
