import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope, walk } from '@/utils';
import cloneDeep from 'lodash.clonedeep';
import { isMetaplexFile, MetaplexFile } from '../../storageModule';
import { JsonMetadata } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'UploadMetadataOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const uploadMetadataOperation =
  useOperation<UploadMetadataOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type UploadMetadataOperation = Operation<
  typeof Key,
  UploadMetadataInput,
  UploadMetadataOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type UploadMetadataInput = JsonMetadata<MetaplexFile | string>;

/**
 * @group Operations
 * @category Outputs
 */
export type UploadMetadataOutput = {
  metadata: JsonMetadata;
  assetUris: string[];
  uri: string;
};

/**
 * @group Operations
 * @category Handlers
 */
export const uploadMetadataOperationHandler: OperationHandler<UploadMetadataOperation> =
  {
    handle: async (
      operation: UploadMetadataOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<UploadMetadataOutput> => {
      const rawMetadata = operation.input;
      const files = getAssetsFromJsonMetadata(rawMetadata);
      const assetUris = await metaplex.storage().uploadAll(files);
      scope.throwIfCanceled();

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
