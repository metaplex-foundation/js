import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createWithdrawFundsInstruction } from '@metaplex-foundation/mpl-candy-machine';
import type { ConfirmOptions } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyMachine } from '../models/CandyMachine';
import { findCandyMachineCollectionPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'DeleteCandyMachineOperation' as const;

/**
 * Deletes an existing Candy Machine.
 *
 * ```ts
 * await metaplex.candyMachines().delete({ candyMachine }).run();
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
  /**
   * The Candy Machine to delete.
   * We need the address of the Candy Machine as well as the address
   * of the potential collection since we will need to delete the PDA account
   * that links the Candy Machine to the collection.
   *
   * If the Candy Machine does not have a collection, simply set
   * `collectionMintAddress` to `null`.
   */
  candyMachine: Pick<CandyMachine, 'address' | 'collectionMintAddress'>;

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
  /** A key to distinguish the instruction that deletes the Candy Machine. */
  instructionKey?: string;
};

/**
 * Deletes an existing Candy Machine.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .candyMachines()
 *   .builders()
 *   .delete({
 *     candyMachine: { address, collectionMintAddress },
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
  const authority = params.authority ?? metaplex.identity();
  const candyMachine = params.candyMachine;

  const deleteInstruction = createWithdrawFundsInstruction({
    candyMachine: candyMachine.address,
    authority: authority.publicKey,
  });

  if (candyMachine.collectionMintAddress) {
    const collectionPda = findCandyMachineCollectionPda(candyMachine.address);
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
