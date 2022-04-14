import { Operation, Plan } from '../../../shared/index.js';
import { UploadMetadataInput, UploadMetadataOutput } from './UploadMetadataOperation.js';

export class PlanUploadMetadataOperation extends Operation<
  UploadMetadataInput,
  Plan<any, UploadMetadataOutput>
> {}
