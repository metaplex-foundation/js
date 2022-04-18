import { useOperation, Plan } from '@/shared';
import { UploadMetadataInput, UploadMetadataOutput } from './UploadMetadataOperation';

export const planUploadMetadataOperation = useOperation<
  UploadMetadataInput,
  Plan<any, UploadMetadataOutput>
>('planUploadMetadataOperation');
