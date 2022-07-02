import type { ConfirmOptions } from '@solana/web3.js';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import { CandyMachine, CandyMachineItem } from './CandyMachine';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { createAddConfigLinesInstruction } from '@metaplex-foundation/mpl-candy-machine';

// -----------------
// Operation
// -----------------

const Key = 'InsertItemsToCandyMachineOperation' as const;
export const insertItemsToCandyMachineOperation =
  useOperation<InsertItemsToCandyMachineOperation>(Key);
export type InsertItemsToCandyMachineOperation = Operation<
  typeof Key,
  InsertItemsToCandyMachineInput,
  InsertItemsToCandyMachineOutput
>;

export type InsertItemsToCandyMachineInput = {
  // Models and Accounts.
  candyMachine: CandyMachine;
  authority: Signer;

  // Data.
  items: CandyMachineItem[];

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export type InsertItemsToCandyMachineOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

export const InsertItemsToCandyMachineOperationHandler: OperationHandler<InsertItemsToCandyMachineOperation> =
  {
    async handle(
      operation: InsertItemsToCandyMachineOperation,
      metaplex: Metaplex
    ): Promise<InsertItemsToCandyMachineOutput> {
      const response = await metaplex
        .rpc()
        .sendAndConfirmTransaction(
          insertItemsToCandyMachineBuilder(operation.input),
          undefined,
          operation.input.confirmOptions
        );

      return {
        response,
      };
    },
  };

// -----------------
// Builder
// -----------------

export type InsertItemsToCandyMachineBuilderParams = Omit<
  InsertItemsToCandyMachineInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const insertItemsToCandyMachineBuilder = (
  params: InsertItemsToCandyMachineBuilderParams
): TransactionBuilder => {
  const index = params.candyMachine.itemsLoaded;
  const configLines = params.items;

  return TransactionBuilder.make().add({
    instruction: createAddConfigLinesInstruction(
      {
        candyMachine: params.candyMachine.address,
        authority: params.authority.publicKey,
      },
      { index, configLines }
    ),
    signers: [params.authority],
    key: params.instructionKey ?? 'insertItems',
  });
};
