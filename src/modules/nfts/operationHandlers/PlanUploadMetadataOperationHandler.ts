import { OperationHandler, Plan } from '@/shared';
import {
  PlanUploadMetadataOperation,
  UploadMetadataInput,
  UploadMetadataOutput,
} from '../operations';

export class PlanUploadMetadataOperationHandler extends OperationHandler<PlanUploadMetadataOperation> {
  public async handle(
    _operation: PlanUploadMetadataOperation
  ): Promise<Plan<UploadMetadataInput, UploadMetadataOutput>> {
    throw new Error('Method not implemented.');
  }
}
