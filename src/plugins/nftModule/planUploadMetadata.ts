import { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { Plan, walk } from '@/utils';
import cloneDeep from 'lodash.clonedeep';
import { isMetaplexFile, MetaplexFile } from '../storageModule';
import { JsonMetadata } from './JsonMetadata';
import { UploadMetadataInput, UploadMetadataOutput } from './uploadMetadata';

const Key = 'PlanUploadMetadataOperation' as const;
export const planUploadMetadataOperation =
  useOperation<PlanUploadMetadataOperation>(Key);
export type PlanUploadMetadataOperation = Operation<
  typeof Key,
  UploadMetadataInput,
  Plan<any, UploadMetadataOutput>
>;

export const planUploadMetadataOperationHandler: OperationHandler<PlanUploadMetadataOperation> =
  {
    handle: async (
      operation: PlanUploadMetadataOperation,
      metaplex: Metaplex
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
    },
  };

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

export const getAssetsFromJsonMetadata = (
  input: UploadMetadataInput
): MetaplexFile[] => {
  const files: MetaplexFile[] = [];

  walk(input, (next, value) => {
    if (isMetaplexFile(value)) {
      files.push(value);
    } else {
      next(value);
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

  walk(clone, (next, value, key, parent) => {
    if (isMetaplexFile(value) && index < replacements.length) {
      parent[key] = replacements[index++];
    }

    next(value);
  });

  return clone as JsonMetadata;
};
