import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import BN from 'bn.js';
import { Pda } from '@/types';
import { AuctionHouseProgram } from './program';

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

export const findAuctionHouseProgramAsSignerPda = (
  programId: PublicKey = AuctionHouseProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('auction_house', 'utf8'),
    Buffer.from('signer', 'utf8'),
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

export const findAuctionHouseBuyerEscrowPda = (
  auctionHouse: PublicKey,
  buyer: PublicKey,
  programId: PublicKey = AuctionHouseProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('auction_house', 'utf8'),
    auctionHouse.toBuffer(),
    buyer.toBuffer(),
  ]);
};

export const findAuctionHouseTradeStatePda = (
  auctionHouse: PublicKey,
  wallet: PublicKey,
  tokenAccount: PublicKey,
  treasuryMint: PublicKey,
  tokenMint: PublicKey,
  tokenSize: BN,
  buyPrice: BN,
  programId: PublicKey = AuctionHouseProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('auction_house', 'utf8'),
    wallet.toBuffer(),
    auctionHouse.toBuffer(),
    tokenAccount.toBuffer(),
    treasuryMint.toBuffer(),
    tokenMint.toBuffer(),
    tokenSize.toBuffer('le', 8),
    buyPrice.toBuffer('le', 8),
  ]);
};
