import { Metaplex } from '@/Metaplex';
import { OperationHandler } from '@/drivers';
import {
  planUploadMetadataOperation,
  UploadMetadataOperation,
  UploadMetadataOutput,
} from '../operations';

export const uploadMetadataOperationHandler: OperationHandler<UploadMetadataOperation> = {
  handle: async (
    operation: UploadMetadataOperation,
    metaplex: Metaplex
  ): Promise<UploadMetadataOutput> => {
    const plan = await metaplex.operations().execute(planUploadMetadataOperation(operation.input));

    return plan.execute();
  },
};
