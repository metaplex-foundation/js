import { MetaplexFile } from '@/drivers';
import { OperationHandler, Plan } from '@/shared';
import { walk } from '@/utils';
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
    const files: MetaplexFile[] = [];

    walk(input, (walk, value) => {
      if (value instanceof MetaplexFile) {
        files.push(value);
      } else {
        walk(value);
      }
    });

    return files;
  }

  protected replaceAssetsWithUris(
    input: UploadMetadataInput,
    replacements: string[]
  ): JsonMetadata {
    let index = 0;

    walk(input, (walk, value, key, parent) => {
      if (value instanceof MetaplexFile && index < replacements.length) {
        parent[key] = replacements[index++];
      }

      walk(value);
    });

    return input as JsonMetadata;
  }
}
