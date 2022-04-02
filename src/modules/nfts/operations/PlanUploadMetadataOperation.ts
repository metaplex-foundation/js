import { Operation, Plan } from '@/shared';
import { UploadMetadataInput, UploadMetadataOutput } from './UploadMetadataOperation';

export class PlanUploadMetadataOperation extends Operation<
  undefined,
  Plan<UploadMetadataInput, UploadMetadataOutput>
> {
  constructor() {
    super(undefined);
  }
}
