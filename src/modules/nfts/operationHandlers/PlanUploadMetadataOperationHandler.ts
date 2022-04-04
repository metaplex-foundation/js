import cloneDeep from 'lodash.clonedeep';
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
  public async handle(
    operation: PlanUploadMetadataOperation
  ): Promise<Plan<any, UploadMetadataOutput>> {
    const metadata = operation.input;
    const files = this.getAssetsFromJsonMetadata(metadata);

    if (files.length <= 0) {
      return Plan.make<any>().addStep({
        name: 'Upload the metadata',
        handler: () => this.uploadMetadata(metadata as JsonMetadata),
      });
    }

    return Plan.make<any>()
      .addStep({
        name: 'Upload assets',
        handler: () => this.uploadAssets(metadata),
      })
      .addStep({
        name: 'Upload the metadata',
        handler: (input) => this.uploadMetadata(input),
      });
  }

  protected async uploadAssets(input: UploadMetadataInput): Promise<JsonMetadata> {
    const files = this.getAssetsFromJsonMetadata(input);
    const uris = await this.metaplex.storage().uploadAll(files);

    return this.replaceAssetsWithUris(input, uris);
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
    const clone = cloneDeep(input);
    let index = 0;

    walk(clone, (walk, value, key, parent) => {
      if (value instanceof MetaplexFile && index < replacements.length) {
        parent[key] = replacements[index++];
      }

      walk(value);
    });

    return clone as JsonMetadata;
  }
}
