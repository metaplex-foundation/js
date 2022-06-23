import { PublicKey } from '@solana/web3.js';
import { Signer } from '@/types';
import { InstructionWithSigners } from '@/utils';
import {
  CreateAuctionHouseInstructionArgs,
  createCreateAuctionHouseInstruction,
} from '@metaplex-foundation/mpl-auction-house';

export type CreateCreateAuctionHouseInstructionWithSignersParams = {
  treasuryMint: PublicKey;
  payer: Signer;
  authority: PublicKey;
  feeWithdrawalDestination: PublicKey;
  treasuryWithdrawalDestination: PublicKey;
  treasuryWithdrawalDestinationOwner: PublicKey;
  auctionHouse: PublicKey;
  auctionHouseFeeAccount: PublicKey;
  auctionHouseTreasury: PublicKey;
  args: CreateAuctionHouseInstructionArgs;
  instructionKey?: string;
};

export const createCreateAuctionHouseInstructionWithSigners = (
  params: CreateCreateAuctionHouseInstructionWithSignersParams
): InstructionWithSigners => {
  const {
    treasuryMint,
    payer,
    authority,
    feeWithdrawalDestination,
    treasuryWithdrawalDestination,
    treasuryWithdrawalDestinationOwner,
    auctionHouse,
    auctionHouseFeeAccount,
    auctionHouseTreasury,
    args,
    instructionKey = 'createAuctionHouse',
  } = params;

  return {
    instruction: createCreateAuctionHouseInstruction(
      {
        treasuryMint,
        payer: payer.publicKey,
        authority,
        feeWithdrawalDestination,
        treasuryWithdrawalDestination,
        treasuryWithdrawalDestinationOwner,
        auctionHouse,
        auctionHouseFeeAccount,
        auctionHouseTreasury,
      },
      args
    ),
    signers: [payer],
    key: instructionKey,
  };
};
