import { Operation, Plan } from '@/shared/index';
import { UploadMetadataInput, UploadMetadataOutput } from './UploadMetadataOperation';

export class PlanUploadMetadataOperation extends Operation<
  UploadMetadataInput,
  Plan<any, UploadMetadataOutput>
> {}
