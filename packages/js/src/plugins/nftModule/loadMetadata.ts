import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, OperationHandler } from '@/types';
import { DisposableScope } from '@/utils';
import { Metadata } from './Metadata';
import { JsonMetadata } from './JsonMetadata';

// -----------------
// Operation
// -----------------

const Key = 'LoadMetadataOperation' as const;
export const loadMetadataOperation = useOperation<LoadMetadataOperation>(Key);
export type LoadMetadataOperation = Operation<
  typeof Key,
  LoadMetadataInput,
  LoadMetadataOutput
>;

export type LoadMetadataInput = {
  metadata: Metadata;
};

export type LoadMetadataOutput = Metadata & { jsonLoaded: true };

// -----------------
// Handler
// -----------------

export const loadMetadataOperationHandler: OperationHandler<LoadMetadataOperation> =
  {
    handle: async (
      operation: LoadMetadataOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<LoadMetadataOutput> => {
      const { metadata } = operation.input;

      try {
        const json = await metaplex
          .storage()
          .downloadJson<JsonMetadata>(metadata.uri, scope);
        return { ...metadata, jsonLoaded: true, json };
      } catch (error) {
        return { ...metadata, jsonLoaded: true, json: null };
      }
    },
  };
