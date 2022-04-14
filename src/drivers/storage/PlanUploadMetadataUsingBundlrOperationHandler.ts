import {
  PlanUploadMetadataOperation,
  PlanUploadMetadataOperationHandler,
  UploadMetadataOutput,
} from '../../modules/index.js';
import { Plan } from '../../shared/index.js';
import { MetaplexFile } from '../filesystem/index.js';
import { BundlrStorageDriver } from './BundlrStorageDriver.js';

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
    const mockUri = 'x'.repeat(100);
    const mockUris = assets.map(() => mockUri);
    const mockedMetadata = this.replaceAssetsWithUris(metadata, mockUris);
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
}
