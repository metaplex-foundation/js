import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Pda } from '@/types';
import { AuctionHouseProgram } from '../AuctionHouseProgram';

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
