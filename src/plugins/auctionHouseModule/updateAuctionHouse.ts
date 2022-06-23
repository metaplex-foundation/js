import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, Signer, OperationHandler } from '@/types';
import { TransactionBuilder } from '@/utils';
import {
  findAssociatedTokenAccountPda,
  createUpdateAuctionHouseInstructionWithSigners,
} from '@/programs';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { AuctionHouse } from './AuctionHouse';
import { TreasureDestinationOwnerRequiredError } from './errors';

// -----------------
// Operation
// -----------------

const Key = 'UpdateAuctionHouseOperation' as const;
export const updateAuctionHouseOperation =
  useOperation<UpdateAuctionHouseOperation>(Key);
export type UpdateAuctionHouseOperation = Operation<
  typeof Key,
  UpdateAuctionHouseInput,
  UpdateAuctionHouseOutput
>;

export type UpdateAuctionHouseInput = {
  // Main Accounts.
  auctionHouse: AuctionHouse;
  authority?: Signer;
  payer?: Signer;

  // Updatable Data.
  sellerFeeBasisPoints?: number | null;
  requiresSignOff?: boolean | null;
  canChangeSalePrice?: boolean | null;
  newAuthority?: PublicKey;
  treasuryMint?: PublicKey;
  feeWithdrawalDestination?: PublicKey;
  treasuryWithdrawalDestinationOwner?: PublicKey;

  // Options.
  confirmOptions?: ConfirmOptions;
};

export type UpdateAuctionHouseOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

export const updateAuctionHouseOperationHandler: OperationHandler<UpdateAuctionHouseOperation> =
  {
    handle: async (
      operation: UpdateAuctionHouseOperation,
      metaplex: Metaplex
    ) => {
      const response = await metaplex
        .rpc()
        .sendAndConfirmTransaction(
          updateAuctionHouseBuilder(metaplex, operation.input),
          undefined,
          operation.input.confirmOptions
        );

      return {
        response,
      };
    },
  };

// -----------------
// Builder
// -----------------

export type UpdateAuctionHouseBuilderParams = Omit<
  UpdateAuctionHouseInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const updateAuctionHouseBuilder = (
  metaplex: Metaplex,
  params: UpdateAuctionHouseBuilderParams
): TransactionBuilder => {
  const authority = params.authority ?? metaplex.identity();
  const payer = params.payer ?? metaplex.identity();
  const auctionHouse = params.auctionHouse;
  const newAuthority = params.newAuthority ?? auctionHouse.authority;
  const treasuryMint = params.treasuryMint ?? auctionHouse.treasuryMint;
  const feeWithdrawalDestination =
    params.feeWithdrawalDestination ?? auctionHouse.feeWithdrawalDestination;

  let treasuryWithdrawalDestinationOwner: PublicKey;
  let treasuryWithdrawalDestination: PublicKey;
  if (auctionHouse.usesSol()) {
    treasuryWithdrawalDestinationOwner =
      params.treasuryWithdrawalDestinationOwner ??
      auctionHouse.treasuryWithdrawalDestination;
    treasuryWithdrawalDestination = treasuryWithdrawalDestinationOwner;
  } else if (params.treasuryWithdrawalDestinationOwner) {
    treasuryWithdrawalDestinationOwner =
      params.treasuryWithdrawalDestinationOwner;
    treasuryWithdrawalDestination = findAssociatedTokenAccountPda(
      treasuryMint,
      treasuryWithdrawalDestinationOwner
    );
  } else {
    throw new TreasureDestinationOwnerRequiredError();
  }

  return TransactionBuilder.make()
    .setFeePayer(payer)
    .add(
      createUpdateAuctionHouseInstructionWithSigners({
        treasuryMint,
        payer,
        authority,
        newAuthority,
        feeWithdrawalDestination,
        treasuryWithdrawalDestination,
        treasuryWithdrawalDestinationOwner,
        auctionHouse: auctionHouse.address,
        args: {
          sellerFeeBasisPoints: params.sellerFeeBasisPoints ?? null,
          requiresSignOff: params.requiresSignOff ?? null,
          canChangeSalePrice: params.canChangeSalePrice ?? null,
        },
        instructionKey: params.instructionKey,
      })
    );
};
