import { OperationHandler } from '@/modules/shared';
import { Plan } from '@/utils';
import { UpdateNftInput, UpdateNftOperation, UpdateNftOutput } from '../operations';

export class UpdateNftOperationHandler extends OperationHandler<UpdateNftOperation> {
  public handle(operation: UpdateNftOperation): Promise<Plan<UpdateNftInput, UpdateNftOutput>> {
    throw new Error('Method not implemented.');
  }
}
