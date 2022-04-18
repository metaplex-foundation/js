import cloneDeep from 'lodash.clonedeep';
import { Metaplex } from '@/Metaplex';
import { MetaplexFile } from '@/drivers';
import { Plan, useOperationHandler } from '@/shared';
import { walk } from '@/utils';
import { JsonMetadata } from '../models';
import {
  PlanUploadMetadataOperation,
  UploadMetadataInput,
  UploadMetadataOutput,
} from '../operations';

export const planUploadMetadataOperationHandler = useOperationHandler<PlanUploadMetadataOperation>(
  async (
    metaplex: Metaplex,
    operation: PlanUploadMetadataOperation
  ): Promise<Plan<any, UploadMetadataOutput>> => {
    const metadata = operation.input;
    const files = getAssetsFromJsonMetadata(metadata);

    if (files.length <= 0) {
      return Plan.make<any>().addStep({
        name: 'Upload the metadata',
        handler: () => uploadMetadata(metaplex, metadata as JsonMetadata),
      });
    }

    return Plan.make<any>()
      .addStep({
        name: 'Upload assets',
        handler: () => uploadAssets(metaplex, metadata),
      })
      .addStep({
        name: 'Upload the metadata',
        handler: (input) => uploadMetadata(metaplex, input),
      });
  }
);

const uploadAssets = async (
  metaplex: Metaplex,
  input: UploadMetadataInput
): Promise<JsonMetadata> => {
  const files = getAssetsFromJsonMetadata(input);
  const uris = await metaplex.storage().uploadAll(files);

  return replaceAssetsWithUris(input, uris);
};

const uploadMetadata = async (
  metaplex: Metaplex,
  metadata: JsonMetadata
): Promise<UploadMetadataOutput> => {
  const uri = await metaplex.storage().uploadJson(metadata);

  return { metadata, uri };
};

export const getAssetsFromJsonMetadata = (input: UploadMetadataInput): MetaplexFile[] => {
  const files: MetaplexFile[] = [];

  walk(input, (walk, value) => {
    if (value instanceof MetaplexFile) {
      files.push(value);
    } else {
      walk(value);
    }
  });

  return files;
};

export const replaceAssetsWithUris = (
  input: UploadMetadataInput,
  replacements: string[]
): JsonMetadata => {
  const clone = cloneDeep(input);
  let index = 0;

  walk(clone, (walk, value, key, parent) => {
    if (value instanceof MetaplexFile && index < replacements.length) {
      parent[key] = replacements[index++];
    }

    walk(value);
  });

  return clone as JsonMetadata;
};
