import {
  PlanUploadMetadataOperation,
  PlanUploadMetadataOperationHandler,
  UploadMetadataOutput,
} from '@/modules';
import { Plan } from '@/shared';
import { MetaplexFile } from '../filesystem';
import { BundlrStorageDriver } from './BundlrStorageDriver';

const MOCK_URI = 'https://arweave.net/I0SChzC7YKr8NNctCCSMWWmrHegvuH4sN_-c6LU51wQ';

export class PlanUploadMetadataUsingBundlrOperationHandler extends PlanUploadMetadataOperationHandler {
  public async handle(
    operation: PlanUploadMetadataOperation
  ): Promise<Plan<any, UploadMetadataOutput>> {
    const metadata = operation.input;
    const plan = await super.handle(operation);
    const storage = this.metaplex.storage();

    if (!(storage instanceof BundlrStorageDriver)) {
      return plan;
    }

    const assets = this.getAssetsFromJsonMetadata(metadata);
    const mockUris = assets.map(() => MOCK_URI);
    const mockedMetadata = this.replaceAssetsWithUris(metadata, mockUris);
    const files: MetaplexFile[] = [...assets, MetaplexFile.fromJson(mockedMetadata)];

    if (!storage.needsFunding(files)) {
      return plan;
    }

    return plan.prependStep<any>({
      name: 'Fund Bundlr wallet',
      handler: () => storage.fund(files),
    });
  }
}
