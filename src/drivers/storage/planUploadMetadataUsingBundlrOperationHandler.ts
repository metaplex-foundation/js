import { Metaplex } from '@/Metaplex';
import {
  getAssetsFromJsonMetadata,
  PlanUploadMetadataOperation,
  planUploadMetadataOperationHandler,
  replaceAssetsWithUris,
  UploadMetadataOutput,
} from '@/modules/nfts';
import { Plan, DisposableScope } from '@/shared';
import { OperationHandler } from '../operations';
import { MetaplexFile } from '../filesystem';
import { BundlrStorageDriver } from './BundlrStorageDriver';

export const planUploadMetadataUsingBundlrOperationHandler: OperationHandler<PlanUploadMetadataOperation> =
  {
    handle: async (
      operation: PlanUploadMetadataOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<Plan<any, UploadMetadataOutput>> => {
      const metadata = operation.input;
      const plan = await planUploadMetadataOperationHandler.handle(operation, metaplex, scope);
      const storage = metaplex.storage();

      if (!(storage instanceof BundlrStorageDriver)) {
        return plan;
      }

      const assets = getAssetsFromJsonMetadata(metadata);
      const mockUri = 'x'.repeat(100);
      const mockUris = assets.map(() => mockUri);
      const mockedMetadata = replaceAssetsWithUris(metadata, mockUris);
      const files: MetaplexFile[] = [...assets, MetaplexFile.fromJson(mockedMetadata)];
      let originalWithdrawAfterUploading = storage.shouldWithdrawAfterUploading();

      return plan
        .prependStep<any>({
          name: 'Fund Bundlr wallet',
          handler: async () => {
            // In this step, we ensure the wallet has enough funds to pay for all the required
            // uploads. We also disable withdrawing after each upload and keep track of its
            // initial state. This prevents having to fund many times within this plan.

            originalWithdrawAfterUploading = storage.shouldWithdrawAfterUploading();
            storage.dontWithdrawAfterUploading();

            const needsFunding = await storage.needsFunding(files);

            if (!needsFunding) {
              return;
            }

            await storage.fund(files);
          },
        })
        .addStep({
          name: 'Withdraw funds from the Bundlr wallet',
          handler: async (output: UploadMetadataOutput) => {
            // Since we've not withdrawn after every upload, we now need to
            // withdraw any remaining funds. After doing so, we must not
            // forget to restore the original withdrawAfterUploading.

            await storage.withdrawAll();

            originalWithdrawAfterUploading
              ? storage.withdrawAfterUploading()
              : storage.dontWithdrawAfterUploading();

            return output;
          },
        });
    },
  };
