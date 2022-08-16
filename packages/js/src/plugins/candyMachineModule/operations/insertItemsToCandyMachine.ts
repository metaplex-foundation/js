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

/**
 * @group Operations
 * @category Constructors
 */
export const insertItemsToCandyMachineOperation =
  useOperation<InsertItemsToCandyMachineOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type InsertItemsToCandyMachineOperation = Operation<
  typeof Key,
  InsertItemsToCandyMachineInput,
  InsertItemsToCandyMachineOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
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

/**
 * @group Operations
 * @category Outputs
 */
export type InsertItemsToCandyMachineOutput = {
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
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

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type InsertItemsToCandyMachineBuilderParams = Omit<
  InsertItemsToCandyMachineInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Constructors
 */
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
