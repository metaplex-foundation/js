import { Metaplex } from '@/Metaplex';
import {
  Operation,
  OperationHandler,
  Program,
  PublicKey,
  Signer,
  useOperation,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import { createWithdrawInstruction } from '@metaplex-foundation/mpl-candy-machine-core';
import { ConfirmOptions } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';

// -----------------
// Operation
// -----------------

const Key = 'DeleteCandyMachineOperation' as const;

/**
 * Deletes a Candy Machine account by withdrawing its rent-exempt balance.
 *
 * ```ts
 * const { candyMachine } = await metaplex
 *   .candyMachines()
 *   .delete({
 *     candyMachine,
 *     authority,
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const deleteCandyMachineOperation =
  useOperation<DeleteCandyMachineOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type DeleteCandyMachineOperation = Operation<
  typeof Key,
  DeleteCandyMachineInput,
  DeleteCandyMachineOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type DeleteCandyMachineInput = {
  /** The address of the Candy Machine account to delete. */
  candyMachine: PublicKey;

  /**
   * The authority of the Candy Machine account.
   *
   * This is the account that will received the rent-exemption
   * lamports from the Candy Machine account.
   *
   * @defaultValue `metaplex.identity()`
   */
  authority?: Signer;

  /**
   * The Signer that should pay for the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /** An optional set of programs that override the registered ones. */
  programs?: Program[];

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type DeleteCandyMachineOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const deleteCandyMachineOperationHandler: OperationHandler<DeleteCandyMachineOperation> =
  {
    async handle(
      operation: DeleteCandyMachineOperation,
      metaplex: Metaplex
    ): Promise<DeleteCandyMachineOutput> {
      return deleteCandyMachineBuilder(
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
export type DeleteCandyMachineBuilderParams = Omit<
  DeleteCandyMachineInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that deletes the Candy Machine account. */
  deleteCandyMachineInstructionKey?: string;
};

/**
 * Deletes a Candy Machine account by withdrawing its rent-exempt balance.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .delete({
 *     candyMachine,
 *     authority,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const deleteCandyMachineBuilder = (
  metaplex: Metaplex,
  params: DeleteCandyMachineBuilderParams
): TransactionBuilder => {
  const {
    candyMachine,
    authority = metaplex.identity(),
    payer = metaplex.identity(),
    programs,
  } = params;

  const candyMachineProgram = metaplex
    .programs()
    .get('CandyMachineProgram', programs);

  return TransactionBuilder.make()
    .setFeePayer(payer)
    .add({
      instruction: createWithdrawInstruction(
        {
          candyMachine,
          authority: authority.publicKey,
        },
        candyMachineProgram.address
      ),
      signers: [authority],
      key: params.deleteCandyMachineInstructionKey ?? 'deleteCandyMachine',
    });
};
