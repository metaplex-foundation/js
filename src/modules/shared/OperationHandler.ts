import { Operation } from './Operation';
import { Plan } from '@/utils';
import { Metaplex } from '@/Metaplex';
import { ConfirmOptions } from '@solana/web3.js';

export abstract class OperationHandler<I, O, T extends Operation<I, O>> {
  public metaplex: Metaplex;
  public confirmOptions?: ConfirmOptions;

  constructor(metaplex: Metaplex, confirmOptions?: ConfirmOptions) {
    this.metaplex = metaplex;
    this.confirmOptions = confirmOptions;
  }

  public abstract handle(operation: T): Promise<Plan<I, O>>;
}
