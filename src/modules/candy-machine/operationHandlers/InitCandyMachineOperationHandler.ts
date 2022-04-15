import { OperationHandler } from '../../../shared';
import { CandyMachine } from '../models/CandyMachine';
import { InitCandyMachineOperation, InitCandyMachineOutput } from '../operations';
import { initCandyMachineBuilder } from '../transactionBuilders';

export class InitCandyMachineOperationHandler extends OperationHandler<InitCandyMachineOperation> {
  async handle(operation: InitCandyMachineOperation): Promise<InitCandyMachineOutput> {
    const transactionId = await this.metaplex.sendAndConfirmTransaction(
      initCandyMachineBuilder(operation.input)
    );

    // TODO(thlorenz): cheating
    const candyMachine = CandyMachine.fromConfig(operation.input);
    return { candyMachine, transactionId };
  }
}
