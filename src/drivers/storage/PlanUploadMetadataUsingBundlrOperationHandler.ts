import { Metaplex } from '@/Metaplex';
import {
  getAssetsFromJsonMetadata,
  PlanUploadMetadataOperation,
  planUploadMetadataOperationHandler,
  replaceAssetsWithUris,
  UploadMetadataOutput,
} from '@/modules/nfts';
import { Plan, useOperationHandler } from '@/shared';
import { MetaplexFile } from '../filesystem';
import { BundlrStorageDriver } from './BundlrStorageDriver';

export const planUploadMetadataUsingBundlrOperationHandler =
  useOperationHandler<PlanUploadMetadataOperation>(
    async (
      metaplex: Metaplex,
      operation: PlanUploadMetadataOperation
    ): Promise<Plan<any, UploadMetadataOutput>> => {
      const metadata = operation.input;
      const plan = await planUploadMetadataOperationHandler(metaplex, operation).load();
      const storage = metaplex.storage();

      if (!(storage instanceof BundlrStorageDriver)) {
        return plan;
      }

      const assets = getAssetsFromJsonMetadata(metadata);
      const mockUri = 'x'.repeat(100);
      const mockUris = assets.map(() => mockUri);
      const mockedMetadata = replaceAssetsWithUris(metadata, mockUris);
      const files: MetaplexFile[] = [...assets, MetaplexFile.fromJson(mockedMetadata)];

      return plan.prependStep<any>({
        name: 'Fund Bundlr wallet',
        handler: async () => {
          const needsFunding = await storage.needsFunding(files);

          if (!needsFunding) {
            return;
          }

          await storage.fund(files);
        },
      });
    }
  );
