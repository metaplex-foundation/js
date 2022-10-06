import { createWithdrawInstruction } from '@metaplex-foundation/mpl-candy-machine-core';
import { ConfirmOptions } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { Metaplex } from '@metaplex-foundation/js-core/Metaplex';
import {
  Operation,
  OperationHandler,
  Program,
  PublicKey,
  Signer,
  useOperation,
} from '@metaplex-foundation/js-core/types';
import { TransactionBuilder } from '@metaplex-foundation/js-core/utils';

// -----------------
// Operation
// -----------------

const Key = 'DeleteCandyMachineOperation' as const;

/**
 * Deletes a Candy Machine account by withdrawing its rent-exempt balance.
 *
 * ```ts
 * await metaplex
 *   .candyMachines()
 *   .delete({
 *     candyMachine: candyMachine.address,
 *     candyGuard: candyMachine.candyGuard.address,
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
   * The address of the Candy Guard associated with the Candy Machine account.
   * When provided the Candy Guard will be deleted as well.
   *
   * @defaultValue Defaults to not being deleted.
   */
  candyGuard?: PublicKey;

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
   * The authority of the Candy Guard account to delete.
   *
   * This is only required if `candyGuard` is provided and the Candy
   * Guard authority is not the same as the Candy Machine authority.
   *
   * @defaultValue `authority`
   */
  candyGuardAuthority?: Signer;

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
 *     candyMachine: candyMachine.address,
 *     candyGuard: candyMachine.candyGuard.address,
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
    candyGuard,
    authority = metaplex.identity(),
    candyGuardAuthority = authority,
    payer = metaplex.identity(),
    programs,
  } = params;

  const candyMachineProgram = metaplex.programs().getCandyMachine(programs);

  const builder = TransactionBuilder.make()
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

  if (candyGuard) {
    builder.add(
      metaplex.candyMachines().builders().deleteCandyGuard({
        candyGuard,
        authority: candyGuardAuthority,
        payer,
        programs,
      })
    );
  }

  return builder;
};
