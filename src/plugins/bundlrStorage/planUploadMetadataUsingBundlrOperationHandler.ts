import { Metaplex } from '@/Metaplex';
import { OperationHandler } from '@/types';
import { Plan, DisposableScope } from '@/utils';
import { isBundlrStorageDriver } from './BundlrStorageDriver';
import { UploadMetadataOutput } from '../nftModule/uploadMetadata';
import {
  getAssetsFromJsonMetadata,
  PlanUploadMetadataOperation,
  planUploadMetadataOperationHandler,
  replaceAssetsWithUris,
} from '../nftModule/planUploadMetadata';
import { MetaplexFile, useMetaplexFileFromJson } from '../storageModule';

export const planUploadMetadataUsingBundlrOperationHandler: OperationHandler<PlanUploadMetadataOperation> =
  {
    handle: async (
      operation: PlanUploadMetadataOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<Plan<any, UploadMetadataOutput>> => {
      const metadata = operation.input;
      const plan = await planUploadMetadataOperationHandler.handle(
        operation,
        metaplex,
        scope
      );
      const storage = metaplex.storage();
      const storageDriver = metaplex.storage().driver();

      if (!isBundlrStorageDriver(storageDriver)) {
        return plan;
      }

      const assets = getAssetsFromJsonMetadata(metadata);
      const mockUri = 'x'.repeat(100);
      const mockUris = assets.map(() => mockUri);
      const mockedMetadata = replaceAssetsWithUris(metadata, mockUris);
      const files: MetaplexFile[] = [
        ...assets,
        useMetaplexFileFromJson(mockedMetadata),
      ];
      let originalWithdrawAfterUploading =
        storageDriver.shouldWithdrawAfterUploading();

      return plan
        .prependStep<any>({
          name: 'Fund Bundlr wallet',
          handler: async () => {
            // In this step, we ensure the wallet has enough funds to pay for all the required
            // uploads. We also disable withdrawing after each upload and keep track of its
            // initial state. This prevents having to fund many times within this plan.

            originalWithdrawAfterUploading =
              storageDriver.shouldWithdrawAfterUploading();
            storageDriver.dontWithdrawAfterUploading();

            const fundsNeeded = await storage.getUploadPriceForFiles(files);
            await storageDriver.fund(fundsNeeded);
          },
        })
        .addStep({
          name: 'Withdraw funds from the Bundlr wallet',
          handler: async (output: UploadMetadataOutput) => {
            // Since we've not withdrawn after every upload, we now need to
            // withdraw any remaining funds. After doing so, we must not
            // forget to restore the original withdrawAfterUploading.

            await storageDriver.withdrawAll();

            originalWithdrawAfterUploading
              ? storageDriver.withdrawAfterUploading()
              : storageDriver.dontWithdrawAfterUploading();

            return output;
          },
        });
    },
  };
