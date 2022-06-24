import { ConfirmOptions } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, OperationHandler } from '@/types';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';

// -----------------
// Operation
// -----------------

const Key = 'CreateListingOperation' as const;
export const createListingOperation = useOperation<CreateListingOperation>(Key);
export type CreateListingOperation = Operation<
  typeof Key,
  CreateListingInput,
  CreateListingOutput
>;

export type CreateListingInput = {
  // Options.
  confirmOptions?: ConfirmOptions;
};

export type CreateListingOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

export const createListingOperationHandler: OperationHandler<CreateListingOperation> =
  {
    handle: async (operation: CreateListingOperation, metaplex: Metaplex) => {
      const builder = createListingBuilder(metaplex, operation.input);

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

export type CreateListingBuilderParams = Omit<
  CreateListingInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const createListingBuilder = (
  metaplex: Metaplex,
  params: CreateListingBuilderParams
): TransactionBuilder => {
  return TransactionBuilder.make();
};
