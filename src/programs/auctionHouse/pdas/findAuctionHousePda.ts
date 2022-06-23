import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Pda } from '@/types';
import { AuctionHouseProgram } from '../AuctionHouseProgram';

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
