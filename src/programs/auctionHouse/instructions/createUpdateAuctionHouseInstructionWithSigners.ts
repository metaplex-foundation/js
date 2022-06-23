import { PublicKey } from '@solana/web3.js';
import { Signer } from '@/types';
import { InstructionWithSigners } from '@/utils';
import {
  createUpdateAuctionHouseInstruction,
  UpdateAuctionHouseInstructionArgs,
} from '@metaplex-foundation/mpl-auction-house';

export type CreateUpdateAuctionHouseInstructionWithSignersParams = {
  treasuryMint: PublicKey;
  payer: Signer;
  authority: Signer;
  newAuthority: PublicKey;
  feeWithdrawalDestination: PublicKey;
  treasuryWithdrawalDestination: PublicKey;
  treasuryWithdrawalDestinationOwner: PublicKey;
  auctionHouse: PublicKey;
  args: UpdateAuctionHouseInstructionArgs;
  instructionKey?: string;
};

export const createUpdateAuctionHouseInstructionWithSigners = (
  params: CreateUpdateAuctionHouseInstructionWithSignersParams
): InstructionWithSigners => {
  const {
    treasuryMint,
    payer,
    authority,
    newAuthority,
    feeWithdrawalDestination,
    treasuryWithdrawalDestination,
    treasuryWithdrawalDestinationOwner,
    auctionHouse,
    args,
    instructionKey = 'updateAuctionHouse',
  } = params;

  return {
    instruction: createUpdateAuctionHouseInstruction(
      {
        treasuryMint,
        payer: payer.publicKey,
        authority: authority.publicKey,
        newAuthority,
        feeWithdrawalDestination,
        treasuryWithdrawalDestination,
        treasuryWithdrawalDestinationOwner,
        auctionHouse,
      },
      args
    ),
    signers: [payer, authority],
    key: instructionKey,
  };
};
