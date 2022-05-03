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
    const { payerSigner: payer = metaplex.identity() } = operation.input;
    const {
      candyMachineSigner: candyMachine = Keypair.generate(),
      walletAddress: wallet = payer.publicKey,
      authorityAddress: authority = payer.publicKey,
      candyMachineData: candyMachineAccount,
      confirmOptions,
    } = operation.input;

    const connection = metaplex.connection;
    const { signature, confirmResponse } = await metaplex.rpc().sendAndConfirmTransaction(
      await initCandyMachineBuilder({
        payerSigner: payer,
        candyMachineSigner: candyMachine,
        walletAddress: wallet,
        authorityAddress: authority,
        candyMachineData: candyMachineAccount,
        confirmOptions,
        connection,
      }),
      undefined,
      confirmOptions
    );

    return {
      // Accounts
      payerSigner: payer,
      candyMachineSigner: candyMachine,
      walletAddress: wallet,
      authorityAddress: authority,
      // Transaction Result
      transactionId: signature,
      confirmResponse,
    };
  },
};
