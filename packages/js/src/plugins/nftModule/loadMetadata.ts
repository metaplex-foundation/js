import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, OperationHandler } from '@/types';
import { DisposableScope } from '@/utils';
import { LazyMetadata, Metadata } from './Metadata';
import { JsonMetadata } from './JsonMetadata';

// -----------------
// Operation
// -----------------

const Key = 'LoadMetadataOperation' as const;
export const loadMetadataOperation = useOperation<LoadMetadataOperation>(Key);
export type LoadMetadataOperation = Operation<
  typeof Key,
  LoadMetadataInput,
  Metadata
>;

export type LoadMetadataInput = {
  metadata: LazyMetadata;
};

// -----------------
// Handler
// -----------------

export const loadMetadataOperationHandler: OperationHandler<LoadMetadataOperation> =
  {
    handle: async (
      operation: LoadMetadataOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<Metadata> => {
      const { metadata } = operation.input;

      try {
        const json = await metaplex
          .storage()
          .downloadJson<JsonMetadata>(metadata.uri, scope);
        return { ...metadata, lazy: false, json };
      } catch (error) {
        return { ...metadata, lazy: false, json: null };
      }
    },
  };
