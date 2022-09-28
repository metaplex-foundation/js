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
 * Insert items into an existing Candy Machine.
 *
 * ```ts
 * await metaplex
 *   .candyMachines()
 *   .insertItems({
 *     candyMachine,
 *     items: [
 *       { name: 'My NFT #1', uri: 'https://example.com/nft1' },
 *       { name: 'My NFT #2', uri: 'https://example.com/nft2' },
 *       { name: 'My NFT #3', uri: 'https://example.com/nft3' },
 *     ],
 *   })
 *   .run();
 * ```
 *
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
  /**
   * The Candy Machine to insert items into.
   *
   * We only need a subset of the `CandyMachine` model.
   * We need its address and the number of items loaded and to be loaded
   * so we can check if the operation is valid.
   */
  candyMachine: Pick<
    CandyMachine,
    'itemsAvailable' | 'itemsLoaded' | 'address'
  >;

  /**
   * The Signer authorized to update the candy machine.
   *
   * @defaultValue `metaplex.identity()`
   */
  authority?: Signer;

  /**
   * The items to insert into the candy machine.
   */
  items: CandyMachineItem[];

  /**
   * The index we should use to insert the new items. This refers to the
   * index of the first item to insert and the others will follow after it.
   *
   * By defaults, this uses the `itemsLoaded` property so items are simply
   * appended to the current items.
   *
   * @defaultValue `candyMachine.itemsLoaded`
   */
  index?: BigNumber;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type InsertItemsToCandyMachineOutput = {
  /** The blockchain response from sending and confirming the transaction. */
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
      return insertItemsToCandyMachineBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
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
 * Insert items into an existing Candy Machine.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .candyMachines()
 *   .builders()
 *   .insertItems({ candyMachine, items });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const insertItemsToCandyMachineBuilder = (
  metaplex: Metaplex,
  params: InsertItemsToCandyMachineBuilderParams
): TransactionBuilder => {
  const authority = params.authority ?? metaplex.identity();
  const index = params.index ?? params.candyMachine.itemsLoaded;
  const items = params.items;
  assertNotFull(params.candyMachine, index);
  assertCanAdd(params.candyMachine, index, items.length);
  assertAllConfigLineConstraints(items);

  return TransactionBuilder.make().add({
    instruction: createAddConfigLinesInstruction(
      {
        candyMachine: params.candyMachine.address,
        authority: authority.publicKey,
      },
      { index: index.toNumber(), configLines: items }
    ),
    signers: [authority],
    key: params.instructionKey ?? 'insertItems',
  });
};
