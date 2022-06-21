import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { useOperation, Operation, Signer, OperationHandler } from '@/types';
import { TransactionBuilder } from '@/utils';
import {
  createCreateAuctionHouseInstructionWithSigners,
  findAuctionHousePda,
} from '@/programs';

const Key = 'CreateAuctionHouseOperation' as const;
export const createAuctionHouseOperation =
  useOperation<CreateAuctionHouseOperation>(Key);
export type CreateAuctionHouseOperation = Operation<
  typeof Key,
  CreateAuctionHouseInput,
  CreateAuctionHouseOutput
>;

export interface CreateAuctionHouseInput {
  //

  // Programs.
  tokenProgram?: PublicKey;
  associatedTokenProgram?: PublicKey;

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface CreateAuctionHouseOutput {
  transactionId: string;
}

export const createAuctionHouseOperationHandler: OperationHandler<CreateAuctionHouseOperation> =
  {
    handle: async (
      operation: CreateAuctionHouseOperation,
      metaplex: Metaplex
    ) => {
      const {
        //
        confirmOptions,
      } = operation.input;

      const { signature } = await metaplex.rpc().sendAndConfirmTransaction(
        createAuctionHouseBuilder({
          //
        }),
        undefined,
        confirmOptions
      );

      return {
        transactionId: signature,
      };
    },
  };

export type CreateAuctionHouseBuilderParams = {
  // Data.
  bump: number;
  feePayerBump: number;
  treasuryBump: number;
  sellerFeeBasisPoints: number;
  requiresSignOff?: boolean;
  canChangeSalePrice?: boolean;

  // Accounts.
  treasuryMint?: PublicKey;
  payer?: Signer;
  authority?: PublicKey;
  feeWithdrawalDestination: PublicKey;
  treasuryWithdrawalDestination: PublicKey;
  treasuryWithdrawalDestinationOwner: PublicKey;
  auctionHouse: PublicKey;
  auctionHouseFeeAccount: PublicKey;
  auctionHouseTreasury: PublicKey;

  // Instruction keys.
  instructionKey?: string;
};

const WRAPPED_SOL_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112'
);

export const createAuctionHouseBuilder = async (
  metaplex: Metaplex,
  params: CreateAuctionHouseBuilderParams
): Promise<TransactionBuilder> => {
  // Data.
  const canChangeSalePrice = params.canChangeSalePrice ?? false;
  const requiresSignOff = params.requiresSignOff ?? canChangeSalePrice;

  // Accounts.
  const authority = params.authority ?? metaplex.identity().publicKey;
  const payer = params.payer ?? metaplex.identity();
  const treasuryMint = params.treasuryMint ?? WRAPPED_SOL_MINT;

  // PDAs.
  const auctionHouse = findAuctionHousePda(authority, treasuryMint);

  return TransactionBuilder.make()
    .setFeePayer(payer)
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
          feePayerBump,
          treasuryBump,
          sellerFeeBasisPoints: params.sellerFeeBasisPoints,
          requiresSignOff,
          canChangeSalePrice,
        },
        instructionKey: params.instructionKey,
      })
    );
};
