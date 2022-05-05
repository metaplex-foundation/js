import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { planUploadMetadataOperation } from '../nftModule';
import { BundlrOptions, BundlrStorageDriver } from './BundlrStorageDriver';
import { planUploadMetadataUsingBundlrOperationHandler } from './planUploadMetadataUsingBundlrOperationHandler';

export const bundlrStorage = (options: BundlrOptions = {}): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.setStorageDriver(new BundlrStorageDriver(metaplex, options));
    metaplex
      .operations()
      .register(planUploadMetadataOperation, planUploadMetadataUsingBundlrOperationHandler);
  },
});
