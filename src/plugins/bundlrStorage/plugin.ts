import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { BundlrOptions, BundlrStorageDriver } from './BundlrStorageDriver';
import { planUploadMetadataOperation } from '../nftModule/planUploadMetadata';
import { planUploadMetadataUsingBundlrOperationHandler } from './planUploadMetadataUsingBundlrOperationHandler';

export const bundlrStorage = (options: BundlrOptions = {}): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.storage().setDriver(new BundlrStorageDriver(metaplex, options));
    metaplex
      .operations()
      .register(
        planUploadMetadataOperation,
        planUploadMetadataUsingBundlrOperationHandler
      );
  },
});
