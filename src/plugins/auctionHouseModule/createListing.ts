import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import type { Metaplex } from '@/Metaplex';
import type { SendAndConfirmTransactionResponse } from '../rpcModule';
import { useOperation, Operation, OperationHandler, Signer } from '@/types';
import { TransactionBuilder } from '@/utils';
import { findAuctionHouseProgramAsSignerPda } from './pdas';
import { AuctionHouse } from './AuctionHouse';

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
  auctionHouse: AuctionHouse;
  wallet: PublicKey | Signer;
  authority?: PublicKey | Signer; // Default: auctionHouse.authority
  mintAccount: PublicKey; // Required for checking Metadata
  tokenAccount?: PublicKey; // Default: ATA
  buyerPrice: number | BN; // Amount?
  tokenSize?: number | BN; // Amount? Currency-less amount? Default: 1

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
  // PDAs.
  const auctionHouseProgramAsSigner = findAuctionHouseProgramAsSignerPda();
  console.log(auctionHouseProgramAsSigner);

  return TransactionBuilder.make();
};
