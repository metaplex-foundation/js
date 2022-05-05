import { Metaplex } from '@/Metaplex';
import { MetaplexFile, Operation, OperationHandler, useOperation } from '@/types';
import { JsonMetadata } from './JsonMetadata';
import { planUploadMetadataOperation } from './planUploadMetadata';

const Key = 'UploadMetadataOperation' as const;
export const uploadMetadataOperation = useOperation<UploadMetadataOperation>(Key);
export type UploadMetadataOperation = Operation<
  typeof Key,
  UploadMetadataInput,
  UploadMetadataOutput
>;

export type UploadMetadataInput = JsonMetadata<MetaplexFile | string>;

export interface UploadMetadataOutput {
  metadata: JsonMetadata;
  uri: string;
}

export const uploadMetadataOperationHandler: OperationHandler<UploadMetadataOperation> = {
  handle: async (
    operation: UploadMetadataOperation,
    metaplex: Metaplex
  ): Promise<UploadMetadataOutput> => {
    const plan = await metaplex.operations().execute(planUploadMetadataOperation(operation.input));

    return plan.execute();
  },
};
