import { Keypair } from '@solana/web3.js';
import { Metaplex } from '../../../Metaplex';
import { OperationHandler } from '../../../shared';
import { InitCandyMachineOperation, InitCandyMachineOutput } from '../operations';
import { initCandyMachineBuilder } from '../transactionBuilders';

export const initCandyMachineOperationHandler: OperationHandler<InitCandyMachineOperation> = {
  async handle(
    operation: InitCandyMachineOperation,
    metaplex: Metaplex
  ): Promise<InitCandyMachineOutput> {
    const { payer = metaplex.identity() } = operation.input;
    const {
      candyMachine = Keypair.generate(),
      wallet = payer.publicKey,
      authority = payer.publicKey,
      candyMachineModel,
      confirmOptions,
    } = operation.input;

    const connection = metaplex.connection;
    const { signature, confirmResponse } = await metaplex.rpc().sendAndConfirmTransaction(
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
      confirmResponse,
    };
  },
};
