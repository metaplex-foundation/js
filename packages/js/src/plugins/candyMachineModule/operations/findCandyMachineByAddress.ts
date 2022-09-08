import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope, TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';

// -----------------
// Operation
// -----------------

const Key = 'CreateCandyGuardOperation' as const;

/**
 * TODO
 *
 * ```ts
 * const { candyMachine } = await metaplex
 *   .candyMachines()
 *   .create({
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const createCandyGuardOperation =
  useOperation<CreateCandyGuardOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CreateCandyGuardOperation = Operation<
  typeof Key,
  CreateCandyGuardInput,
  CreateCandyGuardOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CreateCandyGuardInput = {};

/**
 * @group Operations
 * @category Outputs
 */
export type CreateCandyGuardOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const createCandyGuardOperationHandler: OperationHandler<CreateCandyGuardOperation> =
  {
    async handle(
      operation: CreateCandyGuardOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateCandyGuardOutput> {
      //
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type CreateCandyGuardBuilderParams = Omit<
  CreateCandyGuardInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that creates and initializes the Candy Guard account. */
  createCandyGuardInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateCandyGuardBuilderContext = Omit<
  CreateCandyGuardOutput,
  'response'
>;

/**
 * TODO
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .create({
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const createCandyGuardBuilder = (
  metaplex: Metaplex,
  params: CreateCandyGuardBuilderParams
): TransactionBuilder<CreateCandyGuardBuilderContext> => {
  return TransactionBuilder.make<CreateCandyGuardBuilderContext>()
    .setFeePayer(payer)
    .setContext({});
};
