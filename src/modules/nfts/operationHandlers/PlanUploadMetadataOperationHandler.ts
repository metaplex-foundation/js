import { MetaplexFile } from '@/drivers';
import { OperationHandler, Plan } from '@/shared';
import { JsonMetadata } from '../models';
import {
  PlanUploadMetadataOperation,
  UploadMetadataInput,
  UploadMetadataOutput,
} from '../operations';

export class PlanUploadMetadataOperationHandler extends OperationHandler<PlanUploadMetadataOperation> {
  public async handle(): Promise<Plan<UploadMetadataInput, UploadMetadataOutput>> {
    return Plan.make<UploadMetadataInput>()
      .addStep({
        name: 'Upload assets',
        handler: this.uploadAssets,
      })
      .addStep({
        name: 'Upload the metadata',
        handler: this.uploadMetadata,
      });
  }

  protected async uploadAssets(input: UploadMetadataInput): Promise<JsonMetadata> {
    throw new Error('Method not implemented.');
  }

  protected async uploadMetadata(metadata: JsonMetadata): Promise<UploadMetadataOutput> {
    const uri = await this.metaplex.storage().uploadJson(metadata);

    return { metadata, uri };
  }

  protected getAssetsFromJsonMetadata(input: UploadMetadataInput): MetaplexFile[] {
    throw new Error('Method not implemented.');
  }

  protected replaceAssetsWithUris(input: UploadMetadataInput, replacements: string[]): JsonMetadata {
    throw new Error('Method not implemented.');
  }
}
