import { OperationHandler } from '@/shared';
import { UploadMetadataOperation, UploadMetadataOutput } from '../operations';

export class UploadMetadataOperationHandler extends OperationHandler<UploadMetadataOperation> {
  public async handle(_operation: UploadMetadataOperation): Promise<UploadMetadataOutput> {
    throw new Error('Method not implemented.');
  }
}
