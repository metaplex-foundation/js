import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import {
  useOperation,
  Operation,
  Signer,
  OperationHandler,
  Pda,
} from '@/types';
import { TransactionBuilder, TransactionBuilderResponse } from '@/utils';
import {
  createCreateAuctionHouseInstructionWithSigners,
  findAssociatedTokenAccountPda,
  findAuctionHouseFeePda,
  findAuctionHousePda,
  findAuctionHouseTreasuryPda,
} from '@/programs';

// -----------------
// Operation
// -----------------

const Key = 'CreateAuctionHouseOperation' as const;
export const createAuctionHouseOperation =
  useOperation<CreateAuctionHouseOperation>(Key);
export type CreateAuctionHouseOperation = Operation<
  typeof Key,
  CreateAuctionHouseInput,
  CreateAuctionHouseOutput
>;

export interface CreateAuctionHouseInput {
  // Data.
  sellerFeeBasisPoints: number;
  requiresSignOff?: boolean;
  canChangeSalePrice?: boolean;

  // Accounts.
  treasuryMint?: PublicKey;
  payer?: Signer;
  authority?: PublicKey;
  feeWithdrawalDestination?: PublicKey;
  treasuryWithdrawalDestination?: PublicKey;

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface CreateAuctionHouseOutput {
  transactionId: string;
  auctionHouse: Pda;
  auctionHouseFeeAccount: Pda;
  auctionHouseTreasury: Pda;
  treasuryWithdrawalDestinationAta: PublicKey;
}

// -----------------
// Handler
// -----------------

export const createAuctionHouseOperationHandler: OperationHandler<CreateAuctionHouseOperation> =
  {
    handle: async (
      operation: CreateAuctionHouseOperation,
      metaplex: Metaplex
    ) => {
      const { builder, context } = createAuctionHouseBuilder(
        metaplex,
        operation.input
      );

      const { signature } = await metaplex
        .rpc()
        .sendAndConfirmTransaction(
          builder,
          undefined,
          operation.input.confirmOptions
        );

      return {
        transactionId: signature,
        ...context,
        // TODO: Add Model...
      };
    },
  };

// -----------------
// Builder
// -----------------

export type CreateAuctionHouseBuilderParams = Omit<
  CreateAuctionHouseInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

const WRAPPED_SOL_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112'
);

export const createAuctionHouseBuilder = (
  metaplex: Metaplex,
  params: CreateAuctionHouseBuilderParams
): TransactionBuilderResponse<
  Omit<CreateAuctionHouseOutput, 'transactionId'>
> => {
  // Data.
  const canChangeSalePrice = params.canChangeSalePrice ?? false;
  const requiresSignOff = params.requiresSignOff ?? canChangeSalePrice;

  // Accounts.
  const authority = params.authority ?? metaplex.identity().publicKey;
  const payer = params.payer ?? metaplex.identity();
  const treasuryMint = params.treasuryMint ?? WRAPPED_SOL_MINT;
  const treasuryWithdrawalDestination =
    params.treasuryWithdrawalDestination ?? metaplex.identity().publicKey;
  const feeWithdrawalDestination =
    params.feeWithdrawalDestination ?? metaplex.identity().publicKey;

  // PDAs.
  const auctionHouse = findAuctionHousePda(authority, treasuryMint);
  const auctionHouseFeeAccount = findAuctionHouseFeePda(auctionHouse);
  const auctionHouseTreasury = findAuctionHouseTreasuryPda(auctionHouse);
  const treasuryWithdrawalDestinationAta = treasuryMint.equals(WRAPPED_SOL_MINT)
    ? treasuryWithdrawalDestination
    : findAssociatedTokenAccountPda(
        treasuryMint,
        treasuryWithdrawalDestination
      );

  const builder = TransactionBuilder.make()
    .setFeePayer(payer)
    .add(
      createCreateAuctionHouseInstructionWithSigners({
        treasuryMint,
        payer,
        authority,
        feeWithdrawalDestination,
        treasuryWithdrawalDestination: treasuryWithdrawalDestinationAta,
        treasuryWithdrawalDestinationOwner: treasuryWithdrawalDestination,
        auctionHouse,
        auctionHouseFeeAccount,
        auctionHouseTreasury,
        args: {
          bump: auctionHouse.bump,
          feePayerBump: auctionHouseFeeAccount.bump,
          treasuryBump: auctionHouseTreasury.bump,
          sellerFeeBasisPoints: params.sellerFeeBasisPoints,
          requiresSignOff,
          canChangeSalePrice,
        },
        instructionKey: params.instructionKey,
      })
    );

  return {
    builder,
    context: {
      auctionHouse,
      auctionHouseFeeAccount,
      auctionHouseTreasury,
      treasuryWithdrawalDestinationAta,
    },
  };
};
