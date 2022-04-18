import { useOperation, Plan, NewOperation } from '@/shared';
import { UploadMetadataInput, UploadMetadataOutput } from './uploadMetadataOperation';

export const planUploadMetadataOperation = useOperation<PlanUploadMetadataOperation>(
  'PlanUploadMetadataOperation'
);

export type PlanUploadMetadataOperation = NewOperation<
  'PlanUploadMetadataOperation',
  UploadMetadataInput,
  Plan<any, UploadMetadataOutput>
>;
