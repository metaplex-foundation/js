import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createWithdrawFundsInstruction } from '@metaplex-foundation/mpl-candy-machine';
import type { ConfirmOptions } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyMachine, CandyMachineConfigs } from '../models/CandyMachine';
import { findCandyMachineCollectionPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'DeleteCandyMachineOperation' as const;

/**
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

export type DeleteCandyMachineInputWithoutConfigs = {
  // Models and accounts.
  candyMachine: Pick<CandyMachine, 'address' | 'collectionMintAddress'>;
  authority?: Signer; // Defaults to mx.identity().

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Inputs
 */
export type DeleteCandyMachineInput = DeleteCandyMachineInputWithoutConfigs &
  Partial<CandyMachineConfigs>;

/**
 * @group Operations
 * @category Outputs
 */
export type DeleteCandyMachineOutput = {
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
  instructionKey?: string;
};

/**
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
