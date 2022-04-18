import { Metaplex } from '@/Metaplex';
import { useOperationHandler } from '@/shared';
import {
  planUploadMetadataOperation,
  UploadMetadataOperation,
  UploadMetadataOutput,
} from '../operations';

export const uploadMetadataOperationHandler = useOperationHandler<UploadMetadataOperation>(
  async (metaplex: Metaplex, operation: UploadMetadataOperation): Promise<UploadMetadataOutput> => {
    const plan = await metaplex.execute(planUploadMetadataOperation(operation.input));

    return plan.execute();
  }
);
