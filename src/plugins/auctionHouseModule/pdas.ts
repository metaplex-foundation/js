import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Pda } from '@/types';
import { AuctionHouseProgram } from '@/programs';

export const findAuctionHousePda = (
  creator: PublicKey,
  treasuryMint: PublicKey,
  programId: PublicKey = AuctionHouseProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('auction_house', 'utf8'),
    creator.toBuffer(),
    treasuryMint.toBuffer(),
  ]);
};

export const findAuctionHouseFeePda = (
  auctionHouse: PublicKey,
  programId: PublicKey = AuctionHouseProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('auction_house', 'utf8'),
    auctionHouse.toBuffer(),
    Buffer.from('fee_payer', 'utf8'),
  ]);
};

export const findAuctionHouseTreasuryPda = (
  auctionHouse: PublicKey,
  programId: PublicKey = AuctionHouseProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('auction_house', 'utf8'),
    auctionHouse.toBuffer(),
    Buffer.from('treasury', 'utf8'),
  ]);
};
