import { Metaplex } from '@/Metaplex';
import {
  BigNumber,
  Operation,
  OperationHandler,
  Signer,
  useOperation,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import { createAddConfigLinesInstruction } from '@metaplex-foundation/mpl-candy-machine';
import type { ConfirmOptions } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  assertAllConfigLineConstraints,
  assertCanAdd,
  assertNotFull,
} from '../asserts';
import { CandyMachine, CandyMachineItem } from '../models/CandyMachine';

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
  candyMachine: Pick<
    CandyMachine,
    'itemsAvailable' | 'itemsLoaded' | 'address'
  >;
  authority: Signer;

  // Data.
  items: CandyMachineItem[];
  index?: BigNumber;

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
      return insertItemsToCandyMachineBuilder(operation.input).sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
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
  const index = params.index ?? params.candyMachine.itemsLoaded;
  const items = params.items;
  assertNotFull(params.candyMachine, index);
  assertCanAdd(params.candyMachine, index, items.length);
  assertAllConfigLineConstraints(items);

  return TransactionBuilder.make().add({
    instruction: createAddConfigLinesInstruction(
      {
        candyMachine: params.candyMachine.address,
        authority: params.authority.publicKey,
      },
      { index: index.toNumber(), configLines: items }
    ),
    signers: [params.authority],
    key: params.instructionKey ?? 'insertItems',
  });
};
