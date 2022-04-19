import { Keypair } from '@solana/web3.js';
import { OperationHandler } from '../../../shared';
import { InitCandyMachineOperation, InitCandyMachineOutput } from '../operations';
import { initCandyMachineBuilder } from '../transactionBuilders';

export class InitCandyMachineOperationHandler extends OperationHandler<InitCandyMachineOperation> {
  async handle(operation: InitCandyMachineOperation): Promise<InitCandyMachineOutput> {
    const { payer = this.metaplex.identity() } = operation.input;
    const {
      candyMachine = Keypair.generate(),
      wallet = payer.publicKey,
      authority = payer.publicKey,
      candyMachineModel,
      confirmOptions,
    } = operation.input;

    const connection = this.metaplex.connection;
    const { signature, confirmed } = await this.metaplex.rawSendAndConfirmTransaction(
      await initCandyMachineBuilder({
        payer,
        candyMachine,
        wallet,
        authority,
        candyMachineModel,
        confirmOptions,
        connection,
      }),
      undefined,
      confirmOptions
    );

    return {
      // Accounts
      payer,
      candyMachine,
      wallet,
      authority,
      // Transaction Result
      transactionId: signature,
      confirmed,
    };
  }
}
