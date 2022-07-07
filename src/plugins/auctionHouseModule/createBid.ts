import { ConfirmOptions } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';

// -----------------
// Operation
// -----------------

const Key = 'CreateBidOperation' as const;
export const createBidOperation = useOperation<CreateBidOperation>(Key);
export type CreateBidOperation = Operation<
  typeof Key,
  CreateBidInput,
  CreateBidOutput
>;

export type CreateBidInput = {
  // Options.
  confirmOptions?: ConfirmOptions;
};

export type CreateBidOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

export const createBidOperationHandler: OperationHandler<CreateBidOperation> = {
  handle: async (operation: CreateBidOperation, metaplex: Metaplex) => {
    return createBidBuilder(metaplex, operation.input).sendAndConfirm(
      metaplex,
      operation.input.confirmOptions
    );
  },
};

// -----------------
// Builder
// -----------------

export type CreateBidBuilderParams = Omit<CreateBidInput, 'confirmOptions'> & {
  instructionKey?: string;
};

export const createBidBuilder = (
  metaplex: Metaplex,
  params: CreateBidBuilderParams
): TransactionBuilder => {
  return TransactionBuilder.make();
};
