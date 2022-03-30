import { OperationHandler } from '@/modules/shared';
import { Plan } from '@/utils';
import { Nft } from '../models';
import { FindNftsByCandyMachineInput, FindNftsByCandyMachineOperation } from '../operations';

export class FindNftsByCandyMachineOperationHandler extends OperationHandler<FindNftsByCandyMachineOperation> {
  public handle(
    operation: FindNftsByCandyMachineOperation
  ): Promise<Plan<FindNftsByCandyMachineInput, Nft[]>> {
    throw new Error('Method not implemented.');
  }
}
