import { CandyMachineData } from '@metaplex-foundation/mpl-candy-machine';
import {
  ConfirmOptions,
  PublicKey,
  RpcResponseAndContext,
  SignatureResult,
} from '@solana/web3.js';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { createUpdateCandyMachineInstructionWithSigners } from '@/programs';
import { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';

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

export type UpdateCandyMachineInputWithoutCandyMachineData = {
  // Accounts
  candyMachineAddress: PublicKey;
  walletAddress: PublicKey;
  authoritySigner: Signer;

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export type UpdateCandyMachineInput =
  UpdateCandyMachineInputWithoutCandyMachineData & CandyMachineData;

export type UpdateCandyMachineOutput = {
  // Transaction Result.
  transactionId: string;
  confirmResponse: RpcResponseAndContext<SignatureResult>;
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
      const {
        candyMachineAddress,
        walletAddress,
        authoritySigner,
        confirmOptions,
        ...candyMachineData
      } = operation.input;

      const { signature, confirmResponse } = await metaplex
        .rpc()
        .sendAndConfirmTransaction(
          TransactionBuilder.make().add(
            createUpdateCandyMachineInstructionWithSigners({
              candyMachine: candyMachineAddress,
              wallet: walletAddress,
              authority: authoritySigner,
              data: candyMachineData,
            })
          ),
          undefined,
          confirmOptions
        );

      return {
        transactionId: signature,
        confirmResponse,
      };
    },
  };
