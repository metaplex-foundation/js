import type { ConfirmOptions } from '@solana/web3.js';
import { Operation, OperationHandler, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { CandyMachineConfigs } from './CandyMachineConfigs';
import { CandyMachine } from './CandyMachine';

// -----------------
// Operation
// -----------------

const Key = 'UpdateCandyMachineOperation' as const;
export const updateCandyMachineOperation =
  useOperation<UpdateCandyMachineOperation>(Key);
export type UpdateCandyMachineOperation = Operation<
  typeof Key,
  UpdateCandyMachineInput,
  UpdateCandyMachineOutput
>;

export type UpdateCandyMachineInput = Partial<CandyMachineConfigs> & {
  candyMachine: CandyMachine;

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export type UpdateCandyMachineOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

export const updateCandyMachineOperationHandler: OperationHandler<UpdateCandyMachineOperation> =
  {
    async handle(
      operation: UpdateCandyMachineOperation,
      metaplex: Metaplex
    ): Promise<UpdateCandyMachineOutput> {
      const builder = await updateCandyMachineBuilder(
        metaplex,
        operation.input
      );

      const response = await metaplex
        .rpc()
        .sendAndConfirmTransaction(
          builder,
          undefined,
          operation.input.confirmOptions
        );

      return {
        response,
        ...builder.getContext(),
      };
    },
  };

// -----------------
// Builder
// -----------------

export type UpdateCandyMachineBuilderParams = Omit<
  UpdateCandyMachineInput,
  'confirmOptions'
> & {
  UpdateInstructionKey?: string;
};

export const updateCandyMachineBuilder = async (
  metaplex: Metaplex,
  params: UpdateCandyMachineBuilderParams
): Promise<TransactionBuilder> => {
  // createUpdateCandyMachineInstructionWithSigners({
  //   candyMachine: candyMachineAddress,
  //   wallet: walletAddress,
  //   authority: authoritySigner,
  //   data: candyMachineData,
  // });

  return TransactionBuilder.make();
};
