import { OperationHandler } from '@/shared';
import { Nft } from '../models';
import { FindNftsByOwnerOperation } from '../operations/FindNftsByOwnerOperation';

export class FindNftsByOwnerUsingGpasOperationHandler extends OperationHandler<FindNftsByOwnerOperation> {
  public async handle(operation: FindNftsByOwnerOperation): Promise<Nft[]> {
    return [];
  }
}
