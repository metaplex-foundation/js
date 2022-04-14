import { OperationHandler } from '../../../shared/index.js';
import {
  PlanUploadMetadataOperation,
  UploadMetadataOperation,
  UploadMetadataOutput,
} from '../operations/index.js';

export class UploadMetadataOperationHandler extends OperationHandler<UploadMetadataOperation> {
  public async handle(operation: UploadMetadataOperation): Promise<UploadMetadataOutput> {
    const plan = await this.metaplex.execute(new PlanUploadMetadataOperation(operation.input));

    return plan.execute();
  }
}
