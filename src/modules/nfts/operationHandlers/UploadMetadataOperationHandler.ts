import { OperationHandler } from '@/shared';
import {
  PlanUploadMetadataOperation,
  UploadMetadataOperation,
  UploadMetadataOutput,
} from '../operations';

export class UploadMetadataOperationHandler extends OperationHandler<UploadMetadataOperation> {
  public async handle(operation: UploadMetadataOperation): Promise<UploadMetadataOutput> {
    const plan = await this.metaplex.execute(new PlanUploadMetadataOperation(operation.input));

    return plan.execute();
  }
}
