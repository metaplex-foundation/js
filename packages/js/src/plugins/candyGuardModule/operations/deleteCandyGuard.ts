import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import type { ConfirmOptions } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';

// -----------------
// Operation
// -----------------

const Key = 'DeleteCandyGuardOperation' as const;

/**
 * Deletes an existing Candy Guard.
 *
 * ```ts
 * await metaplex.candyGuards().delete({ candyGuard }).run();
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
  /**
   * The Candy Guard to delete.
   * We need the address of the Candy Guard as well as the address
   * of the potential collection since we will need to delete the PDA account
   * that links the Candy Guard to the collection.
   *
   * If the Candy Guard does not have a collection, simply set
   * `collectionMintAddress` to `null`.
   */
  candyGuard: Pick<CandyGuard, 'address' | 'collectionMintAddress'>;

  /**
   * The Signer authorized to update the candy Guard.
   *
   * @defaultValue `metaplex.identity()`
   */
  authority?: Signer;

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
  /** A key to distinguish the instruction that deletes the Candy Guard. */
  instructionKey?: string;
};

/**
 * Deletes an existing Candy Guard.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .candyGuards()
 *   .builders()
 *   .delete({
 *     candyGuard: { address, collectionMintAddress },
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
  const authority = params.authority ?? metaplex.identity();
  const candyGuard = params.candyGuard;

  const deleteInstruction = createWithdrawFundsInstruction({
    candyGuard: candyGuard.address,
    authority: authority.publicKey,
  });

  if (candyGuard.collectionMintAddress) {
    const collectionPda = findCandyGuardCollectionPda(candyGuard.address);
    deleteInstruction.keys.push({
      pubkey: collectionPda,
      isWritable: true,
      isSigner: false,
    });
  }

  return (
    TransactionBuilder.make()

      // This is important because, otherwise, the authority will not be identitied
      // as a mutable account and debitting it will cause an error.
      .setFeePayer(authority)

      .add({
        instruction: deleteInstruction,
        signers: [authority],
        key: params.instructionKey ?? 'withdrawFunds',
      })
  );
};
