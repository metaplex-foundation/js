import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { BigNumber, Pda } from '@/types';
import { Option } from '@/utils';
import { AuctionHouseProgram } from './program';

/** @group Pdas */
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

/** @group Pdas */
export const findAuctioneerPda = (
  auctionHouse: PublicKey,
  auctioneerAuthority: PublicKey,
  programId: PublicKey = AuctionHouseProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('auctioneer', 'utf8'),
    auctionHouse.toBuffer(),
    auctioneerAuthority.toBuffer(),
  ]);
};

/** @group Pdas */
export const findAuctionHouseProgramAsSignerPda = (
  programId: PublicKey = AuctionHouseProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('auction_house', 'utf8'),
    Buffer.from('signer', 'utf8'),
  ]);
};

/** @group Pdas */
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

/** @group Pdas */
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

/** @group Pdas */
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

/** @group Pdas */
export const findAuctionHouseTradeStatePda = (
  auctionHouse: PublicKey,
  wallet: PublicKey,
  treasuryMint: PublicKey,
  tokenMint: PublicKey,
  buyPrice: BigNumber,
  tokenSize: BigNumber,
  tokenAccount?: Option<PublicKey>,
  programId: PublicKey = AuctionHouseProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('auction_house', 'utf8'),
    wallet.toBuffer(),
    auctionHouse.toBuffer(),
    ...(tokenAccount ? [tokenAccount.toBuffer()] : []),
    treasuryMint.toBuffer(),
    tokenMint.toBuffer(),
    buyPrice.toArrayLike(Buffer, 'le', 8),
    tokenSize.toArrayLike(Buffer, 'le', 8),
  ]);
};

/** @group Pdas */
export const findListingReceiptPda = (
  tradeState: PublicKey,
  programId: PublicKey = AuctionHouseProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('listing_receipt', 'utf8'),
    tradeState.toBuffer(),
  ]);
};

/** @group Pdas */
export const findBidReceiptPda = (
  tradeState: PublicKey,
  programId: PublicKey = AuctionHouseProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('bid_receipt', 'utf8'),
    tradeState.toBuffer(),
  ]);
};

/** @group Pdas */
export const findPurchaseReceiptPda = (
  sellerTradeState: PublicKey,
  buyerTradeState: PublicKey,
  programId: PublicKey = AuctionHouseProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('purchase_receipt', 'utf8'),
    sellerTradeState.toBuffer(),
    buyerTradeState.toBuffer(),
  ]);
};
