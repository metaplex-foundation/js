import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import {
  useOperation,
  Operation,
  Signer,
  OperationHandler,
  Pda,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import {
  createCreateAuctionHouseInstructionWithSigners,
  findAssociatedTokenAccountPda,
  findAuctionHouseFeePda,
  findAuctionHousePda,
  findAuctionHouseTreasuryPda,
} from '@/programs';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { WRAPPED_SOL_MINT } from './constants';

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

export type CreateAuctionHouseInput = {
  // Data.
  sellerFeeBasisPoints: number;
  requiresSignOff?: boolean;
  canChangeSalePrice?: boolean;

  // Accounts.
  treasuryMint?: PublicKey;
  payer?: Signer;
  authority?: PublicKey;
  feeWithdrawalDestination?: PublicKey;
  treasuryWithdrawalDestinationOwner?: PublicKey;

  // Options.
  confirmOptions?: ConfirmOptions;
};

export type CreateAuctionHouseOutput = {
  response: SendAndConfirmTransactionResponse;
  auctionHouse: Pda;
  auctionHouseFeeAccount: Pda;
  auctionHouseTreasury: Pda;
  treasuryWithdrawalDestination: PublicKey;
};

// -----------------
// Handler
// -----------------

export const createAuctionHouseOperationHandler: OperationHandler<CreateAuctionHouseOperation> =
  {
    handle: async (
      operation: CreateAuctionHouseOperation,
      metaplex: Metaplex
    ) => {
      const builder = createAuctionHouseBuilder(metaplex, operation.input);

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

export type CreateAuctionHouseBuilderParams = Omit<
  CreateAuctionHouseInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export type CreateAuctionHouseBuilderContext = Omit<
  CreateAuctionHouseOutput,
  'response'
>;

export const createAuctionHouseBuilder = (
  metaplex: Metaplex,
  params: CreateAuctionHouseBuilderParams
): TransactionBuilder<CreateAuctionHouseBuilderContext> => {
  // Data.
  const canChangeSalePrice = params.canChangeSalePrice ?? false;
  const requiresSignOff = params.requiresSignOff ?? canChangeSalePrice;

  // Accounts.
  const authority = params.authority ?? metaplex.identity().publicKey;
  const payer = params.payer ?? metaplex.identity();
  const treasuryMint = params.treasuryMint ?? WRAPPED_SOL_MINT;
  const treasuryWithdrawalDestinationOwner =
    params.treasuryWithdrawalDestinationOwner ?? metaplex.identity().publicKey;
  const feeWithdrawalDestination =
    params.feeWithdrawalDestination ?? metaplex.identity().publicKey;

  // PDAs.
  const auctionHouse = findAuctionHousePda(authority, treasuryMint);
  const auctionHouseFeeAccount = findAuctionHouseFeePda(auctionHouse);
  const auctionHouseTreasury = findAuctionHouseTreasuryPda(auctionHouse);
  const treasuryWithdrawalDestination = treasuryMint.equals(WRAPPED_SOL_MINT)
    ? treasuryWithdrawalDestinationOwner
    : findAssociatedTokenAccountPda(
        treasuryMint,
        treasuryWithdrawalDestinationOwner
      );

  return TransactionBuilder.make<CreateAuctionHouseBuilderContext>()
    .setFeePayer(payer)
    .setContext({
      auctionHouse,
      auctionHouseFeeAccount,
      auctionHouseTreasury,
      treasuryWithdrawalDestination,
    })
    .add(
      createCreateAuctionHouseInstructionWithSigners({
        treasuryMint,
        payer,
        authority,
        feeWithdrawalDestination,
        treasuryWithdrawalDestination,
        treasuryWithdrawalDestinationOwner,
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
};
