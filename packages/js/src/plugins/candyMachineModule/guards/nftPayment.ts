import { createSerializerFromBeet, PublicKey } from '@/types';
import { nftPaymentBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type NftPaymentGuardSettings = {
  burn: boolean;
  requiredCollection: PublicKey;
};

/** @internal */
export const NftPaymentGuardManifest: CandyGuardManifest<NftPaymentGuardSettings> =
  {
    name: 'NftPayment',
    settingsBytes: 40,
    settingsSerializer: createSerializerFromBeet(nftPaymentBeet),
  };
