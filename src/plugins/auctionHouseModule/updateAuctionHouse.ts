import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { createUpdateAuctionHouseInstruction } from '@metaplex-foundation/mpl-auction-house';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, Signer, OperationHandler } from '@/types';
import { TransactionBuilder } from '@/utils';
import { findAssociatedTokenAccountPda } from '../tokenModule';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { AuctionHouse } from './AuctionHouse';
import { TreasuryDestinationOwnerRequiredError } from './errors';

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
  const newAuthority = params.newAuthority ?? auctionHouse.authorityAddress;
  const feeWithdrawalDestination =
    params.feeWithdrawalDestination ??
    auctionHouse.feeWithdrawalDestinationAddress;

  let treasuryWithdrawalDestinationOwner: PublicKey;
  let treasuryWithdrawalDestination: PublicKey;
  if (auctionHouse.isNative) {
    treasuryWithdrawalDestinationOwner =
      params.treasuryWithdrawalDestinationOwner ??
      auctionHouse.treasuryWithdrawalDestinationAddress;
    treasuryWithdrawalDestination = treasuryWithdrawalDestinationOwner;
  } else if (params.treasuryWithdrawalDestinationOwner) {
    treasuryWithdrawalDestinationOwner =
      params.treasuryWithdrawalDestinationOwner;
    treasuryWithdrawalDestination = findAssociatedTokenAccountPda(
      auctionHouse.treasuryMint.address,
      treasuryWithdrawalDestinationOwner
    );
  } else {
    throw new TreasuryDestinationOwnerRequiredError();
  }

  return TransactionBuilder.make()
    .setFeePayer(payer)
    .add({
      instruction: createUpdateAuctionHouseInstruction(
        {
          treasuryMint: auctionHouse.treasuryMint.address,
          payer: payer.publicKey,
          authority: authority.publicKey,
          newAuthority,
          feeWithdrawalDestination,
          treasuryWithdrawalDestination,
          treasuryWithdrawalDestinationOwner,
          auctionHouse: auctionHouse.address,
        },
        {
          sellerFeeBasisPoints: params.sellerFeeBasisPoints ?? null,
          requiresSignOff: params.requiresSignOff ?? null,
          canChangeSalePrice: params.canChangeSalePrice ?? null,
        }
      ),
      signers: [payer, authority],
      key: params.instructionKey ?? 'updateAuctionHouse',
    });
};
