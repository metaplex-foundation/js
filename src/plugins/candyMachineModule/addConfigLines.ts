import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { createAddConfigLinesInstructionWithSigners } from '@/programs';
import {
  ConfirmOptions,
  PublicKey,
  RpcResponseAndContext,
  SignatureResult,
} from '@solana/web3.js';
import { ConfigLine } from '@metaplex-foundation/mpl-candy-machine';
import { TransactionBuilder } from '@/utils';

// -----------------
// Operation
// -----------------
const Key = 'AddConfigLinesOperation' as const;
export const addConfigLinesOperation =
  useOperation<AddConfigLinesOperation>(Key);

export type AddConfigLinesOperation = Operation<
  typeof Key,
  AddConfigLinesInput,
  AddConfigLinesOutput
>;

export type AddConfigLinesInput = {
  // Accounts
  candyMachineAddress: PublicKey;
  authoritySigner: Signer;

  // Args
  index: number;
  configLines: ConfigLine[];

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};
export type AddConfigLinesOutput = {
  // Transaction Result.
  transactionId: string;
  confirmResponse: RpcResponseAndContext<SignatureResult>;
};

// -----------------
// Handler
// -----------------
export const addConfigLinesOperationHandler: OperationHandler<AddConfigLinesOperation> =
  {
    async handle(
      operation: AddConfigLinesOperation,
      metaplex: Metaplex
    ): Promise<AddConfigLinesOutput> {
      const {
        candyMachineAddress,
        authoritySigner,
        index,
        configLines,
        confirmOptions,
      } = operation.input;

      const { signature, confirmResponse } = await metaplex
        .rpc()
        .sendAndConfirmTransaction(
          TransactionBuilder.make().add(
            createAddConfigLinesInstructionWithSigners({
              candyMachine: candyMachineAddress,
              authority: authoritySigner,
              index,
              configLines,
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
