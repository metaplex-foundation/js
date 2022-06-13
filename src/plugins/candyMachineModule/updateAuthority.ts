import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { createUpdateAuthorityInstructionWithSigners } from '@/programs';
import {
  ConfirmOptions,
  PublicKey,
  RpcResponseAndContext,
  SignatureResult,
} from '@solana/web3.js';
import { TransactionBuilder } from '@/utils';

// -----------------
// Operation
// -----------------
const Key = 'UpdateAuthorityOperation' as const;
export const updateAuthorityOperation =
  useOperation<UpdateAuthorityOperation>(Key);

export type UpdateAuthorityOperation = Operation<
  typeof Key,
  UpdateAuthorityInput,
  UpdateAuthorityOutput
>;

export type UpdateAuthorityInput = {
  // Accounts
  candyMachineAddress: PublicKey;
  walletAddress: PublicKey;
  authoritySigner: Signer;

  // Args
  newAuthorityAddress: PublicKey;

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};
export type UpdateAuthorityOutput = {
  // Transaction Result.
  transactionId: string;
  confirmResponse: RpcResponseAndContext<SignatureResult>;
};

// -----------------
// Handler
// -----------------
export const updateAuthorityOperationHandler: OperationHandler<UpdateAuthorityOperation> =
  {
    async handle(
      operation: UpdateAuthorityOperation,
      metaplex: Metaplex
    ): Promise<UpdateAuthorityOutput> {
      const {
        candyMachineAddress,
        walletAddress,
        authoritySigner,
        confirmOptions,
        newAuthorityAddress,
      } = operation.input;

      const { signature, confirmResponse } = await metaplex
        .rpc()
        .sendAndConfirmTransaction(
          TransactionBuilder.make().add(
            createUpdateAuthorityInstructionWithSigners({
              candyMachine: candyMachineAddress,
              wallet: walletAddress,
              authority: authoritySigner,
              newAuthority: newAuthorityAddress,
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
