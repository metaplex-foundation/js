import type { ConfirmOptions } from '@solana/web3.js';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { CandyMachine, CandyMachineConfigs } from './CandyMachine';
import { createWithdrawFundsInstruction } from '@metaplex-foundation/mpl-candy-machine';
import { findCandyMachineCollectionPda } from './pdas';

// -----------------
// Operation
// -----------------

const Key = 'DeleteCandyMachineOperation' as const;
export const deleteCandyMachineOperation =
  useOperation<DeleteCandyMachineOperation>(Key);
export type DeleteCandyMachineOperation = Operation<
  typeof Key,
  DeleteCandyMachineInput,
  DeleteCandyMachineOutput
>;

export type DeleteCandyMachineInputWithoutConfigs = {
  // Models and accounts.
  candyMachine: CandyMachine;
  authority?: Signer; // Defaults to mx.identity().

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export type DeleteCandyMachineInput = DeleteCandyMachineInputWithoutConfigs &
  Partial<CandyMachineConfigs>;

export type DeleteCandyMachineOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

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

export type DeleteCandyMachineBuilderParams = Omit<
  DeleteCandyMachineInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

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
        key: params.instructionKey ?? 'widrawFunds',
      })
  );
};
