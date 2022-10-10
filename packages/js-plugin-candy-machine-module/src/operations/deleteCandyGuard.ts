import { createWithdrawInstruction } from '@metaplex-foundation/mpl-candy-guard';
import { ConfirmOptions } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '@metaplex-foundation/js-core';
import { Metaplex } from '@metaplex-foundation/js-core/Metaplex';
import {
  Operation,
  OperationHandler,
  Program,
  PublicKey,
  Signer,
  useOperation,
} from '@metaplex-foundation/js-core';
import { TransactionBuilder } from '@metaplex-foundation/js-core';

// -----------------
// Operation
// -----------------

const Key = 'DeleteCandyGuardOperation' as const;

/**
 * Deletes a Candy Guard account by withdrawing its rent-exempt balance.
 *
 * ```ts
 * await metaplex
 *   .candyMachines()
 *   .deleteCandyGuard({
 *     candyGuard,
 *     authority,
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const deleteCandyGuardOperation =
  useOperation<DeleteCandyGuardOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type DeleteCandyGuardOperation = Operation<
  typeof Key,
  DeleteCandyGuardInput,
  DeleteCandyGuardOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type DeleteCandyGuardInput = {
  /** The address of the Candy Guard account to delete. */
  candyGuard: PublicKey;

  /**
   * The authority of the Candy Guard account.
   *
   * This is the account that will received the rent-exemption
   * lamports from the Candy Guard account.
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
export type DeleteCandyGuardOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const deleteCandyGuardOperationHandler: OperationHandler<DeleteCandyGuardOperation> =
  {
    async handle(
      operation: DeleteCandyGuardOperation,
      metaplex: Metaplex
    ): Promise<DeleteCandyGuardOutput> {
      return deleteCandyGuardBuilder(metaplex, operation.input).sendAndConfirm(
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
export type DeleteCandyGuardBuilderParams = Omit<
  DeleteCandyGuardInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that deletes the Candy Guard account. */
  deleteCandyGuardInstructionKey?: string;
};

/**
 * Deletes a Candy Guard account by withdrawing its rent-exempt balance.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyMachines()
 *   .builders()
 *   .deleteCandyGuard({
 *     candyGuard,
 *     authority,
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const deleteCandyGuardBuilder = (
  metaplex: Metaplex,
  params: DeleteCandyGuardBuilderParams
): TransactionBuilder => {
  const {
    candyGuard,
    authority = metaplex.identity(),
    payer = metaplex.identity(),
    programs,
  } = params;

  const candyGuardProgram = metaplex.programs().getCandyGuard(programs);

  return TransactionBuilder.make()
    .setFeePayer(payer)
    .add({
      instruction: createWithdrawInstruction(
        {
          candyGuard,
          authority: authority.publicKey,
        },
        candyGuardProgram.address
      ),
      signers: [authority],
      key: params.deleteCandyGuardInstructionKey ?? 'deleteCandyGuard',
    });
};
