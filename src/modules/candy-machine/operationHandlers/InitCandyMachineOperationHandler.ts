import { Keypair } from '@solana/web3.js';
import { OperationHandler } from '../../../shared';
import { InitCandyMachineOperation, InitCandyMachineOutput } from '../operations';
import { initCandyMachineBuilder } from '../transactionBuilders';

export class InitCandyMachineOperationHandler extends OperationHandler<InitCandyMachineOperation> {
  async handle(operation: InitCandyMachineOperation): Promise<InitCandyMachineOutput> {
    const {
      payer,
      candyMachine = Keypair.generate().publicKey,
      wallet = payer.publicKey,
      authority = payer.publicKey,
      candyMachineModel,
      confirmOptions,
    } = operation.input;

    const transactionId = await this.metaplex.sendAndConfirmTransaction(
      initCandyMachineBuilder({
        payer,
        candyMachine,
        wallet,
        authority,
        candyMachineModel,
        confirmOptions,
      }),
      undefined,
      confirmOptions
    );

    // TODO(thlorenz): retrieve account and deserialize
    return { candyMachine: operation.input.candyMachineModel, transactionId };
  }
}
