import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler } from '@/types';
import { DisposableScope, TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';

// -----------------
// Operation
// -----------------

const Key = 'UpdateCandyMachineOperation' as const;

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
export const updateCandyMachineOperation = <
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
>(
  input: UpdateCandyMachineInput<T>
): UpdateCandyMachineOperation<T> => ({ key: Key, input });
updateCandyMachineOperation.key = Key;

/**
 * @group Operations
 * @category Types
 */
export type UpdateCandyMachineOperation<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Operation<typeof Key, UpdateCandyMachineInput<T>, UpdateCandyMachineOutput>;

/**
 * @group Operations
 * @category Inputs
 */
export type UpdateCandyMachineInput<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = {
  //
};

/**
 * @group Operations
 * @category Outputs
 */
export type UpdateCandyMachineOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const updateCandyMachineOperationHandler: OperationHandler<UpdateCandyMachineOperation> =
  {
    async handle<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
      operation: UpdateCandyMachineOperation<T>,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<UpdateCandyMachineOutput> {
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
export type UpdateCandyMachineBuilderParams<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Omit<UpdateCandyMachineInput<T>, 'confirmOptions'> & {
  /** A key to distinguish the instruction that creates and initializes the Candy Guard account. */
  updateCandyMachineInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type UpdateCandyMachineBuilderContext = Omit<
  UpdateCandyMachineOutput,
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
export const updateCandyMachineBuilder = <
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
>(
  metaplex: Metaplex,
  params: UpdateCandyMachineBuilderParams<T>
): TransactionBuilder<UpdateCandyMachineBuilderContext> => {
  return TransactionBuilder.make<UpdateCandyMachineBuilderContext>()
    .setFeePayer(payer)
    .setContext({});
};
