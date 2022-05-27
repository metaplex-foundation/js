import cloneDeep from 'lodash.clonedeep';
import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { walk } from '@/utils';
import { JsonMetadata } from './JsonMetadata';
import { isMetaplexFile, MetaplexFile } from '../storageModule';

const Key = 'UploadMetadataOperation' as const;
export const uploadMetadataOperation =
  useOperation<UploadMetadataOperation>(Key);
export type UploadMetadataOperation = Operation<
  typeof Key,
  UploadMetadataInput,
  UploadMetadataOutput
>;

export type UploadMetadataInput = JsonMetadata<MetaplexFile | string>;

export interface UploadMetadataOutput {
  metadata: JsonMetadata;
  assetUris: string[];
  uri: string;
}

export const uploadMetadataOperationHandler: OperationHandler<UploadMetadataOperation> =
  {
    handle: async (
      operation: UploadMetadataOperation,
      metaplex: Metaplex
    ): Promise<UploadMetadataOutput> => {
      const rawMetadata = operation.input;
      const files = getAssetsFromJsonMetadata(rawMetadata);
      const assetUris = await metaplex.storage().uploadAll(files);
      const metadata = replaceAssetsWithUris(rawMetadata, assetUris);
      const uri = await metaplex.storage().uploadJson(metadata);

      return { uri, metadata, assetUris };
    },
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
