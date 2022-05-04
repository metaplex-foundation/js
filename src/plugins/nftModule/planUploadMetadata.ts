import { useOperation, Operation } from '@/drivers';
import { Plan } from '@/shared';
import { UploadMetadataInput, UploadMetadataOutput } from './uploadMetadataOperation';

export const planUploadMetadataOperation = useOperation<PlanUploadMetadataOperation>(
  'PlanUploadMetadataOperation'
);

export type PlanUploadMetadataOperation = Operation<
  'PlanUploadMetadataOperation',
  UploadMetadataInput,
  Plan<any, UploadMetadataOutput>
>;
