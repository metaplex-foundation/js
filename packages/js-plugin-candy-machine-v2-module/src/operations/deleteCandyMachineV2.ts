import { createWithdrawFundsInstruction } from '@metaplex-foundation/mpl-candy-machine';
import type { ConfirmOptions } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '@metaplex-foundation/js-core';
import { CandyMachineV2 } from '../models/CandyMachineV2';
import { findCandyMachineV2CollectionPda } from '../pdas';
import { TransactionBuilder } from '@metaplex-foundation/js-core';
import {
  Operation,
  OperationHandler,
  Signer,
  useOperation,
} from '@metaplex-foundation/js-core';
import { Metaplex } from '@metaplex-foundation/js-core/Metaplex';

// -----------------
// Operation
// -----------------

const Key = 'DeleteCandyMachineV2Operation' as const;

/**
 * Deletes an existing Candy Machine.
 *
 * ```ts
 * await metaplex.candyMachinesV2().delete({ candyMachine }).run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const deleteCandyMachineV2Operation =
  useOperation<DeleteCandyMachineV2Operation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type DeleteCandyMachineV2Operation = Operation<
  typeof Key,
  DeleteCandyMachineV2Input,
  DeleteCandyMachineV2Output
>;

/**
 * @group Operations
 * @category Inputs
 */
export type DeleteCandyMachineV2Input = {
  /**
   * The Candy Machine to delete.
   * We need the address of the Candy Machine as well as the address
   * of the potential collection since we will need to delete the PDA account
   * that links the Candy Machine to the collection.
   *
   * If the Candy Machine does not have a collection, simply set
   * `collectionMintAddress` to `null`.
   */
  candyMachine: Pick<CandyMachineV2, 'address' | 'collectionMintAddress'>;

  /**
   * The Signer authorized to update the candy machine.
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
export type DeleteCandyMachineV2Output = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const deleteCandyMachineV2OperationHandler: OperationHandler<DeleteCandyMachineV2Operation> =
  {
    async handle(
      operation: DeleteCandyMachineV2Operation,
      metaplex: Metaplex
    ): Promise<DeleteCandyMachineV2Output> {
      return deleteCandyMachineV2Builder(
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
export type DeleteCandyMachineV2BuilderParams = Omit<
  DeleteCandyMachineV2Input,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that deletes the Candy Machine. */
  instructionKey?: string;
};

/**
 * Deletes an existing Candy Machine.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .candyMachinesV2()
 *   .builders()
 *   .delete({
 *     candyMachine: { address, collectionMintAddress },
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const deleteCandyMachineV2Builder = (
  metaplex: Metaplex,
  params: DeleteCandyMachineV2BuilderParams
): TransactionBuilder => {
  const authority = params.authority ?? metaplex.identity();
  const { candyMachine } = params;

  const deleteInstruction = createWithdrawFundsInstruction({
    candyMachine: candyMachine.address,
    authority: authority.publicKey,
  });

  if (candyMachine.collectionMintAddress) {
    const collectionPda = findCandyMachineV2CollectionPda(candyMachine.address);
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
