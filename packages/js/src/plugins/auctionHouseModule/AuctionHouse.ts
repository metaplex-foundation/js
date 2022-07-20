import type { PublicKey } from '@solana/web3.js';
import { Pda } from '@/types';
import { AuctionHouseAccount } from './accounts';
import { assert } from '@/utils';
import { Mint } from '../tokenModule';
import { MintWithMetadata } from '../nftModule';

export type AuctionHouse = Readonly<{
  model: 'auctionHouse';
  address: Pda;
  creatorAddress: PublicKey;
  authorityAddress: PublicKey;
  treasuryMint: Mint | MintWithMetadata;
  feeAccountAddress: Pda;
  treasuryAccountAddress: Pda;
  feeWithdrawalDestinationAddress: PublicKey;
  treasuryWithdrawalDestinationAddress: PublicKey;
  sellerFeeBasisPoints: number;
  requiresSignOff: boolean;
  canChangeSalePrice: boolean;
  isNative: boolean;
}>;

export const isAuctionHouse = (value: any): value is AuctionHouse =>
  typeof value === 'object' && value.model === 'auctionHouse';

export function assertAuctionHouse(value: any): asserts value is AuctionHouse {
  assert(isAuctionHouse(value), `Expected AuctionHouse type`);
}
export const toAuctionHouse = (
  auctionHouseAccount: AuctionHouseAccount,
  treasuryMint: Mint | MintWithMetadata
): AuctionHouse => ({
  model: 'auctionHouse',
  address: new Pda(
    auctionHouseAccount.publicKey,
    auctionHouseAccount.data.bump
  ),
  creatorAddress: auctionHouseAccount.data.creator,
  authorityAddress: auctionHouseAccount.data.authority,
  treasuryMint,
  feeAccountAddress: new Pda(
    auctionHouseAccount.data.auctionHouseFeeAccount,
    auctionHouseAccount.data.feePayerBump
  ),
  treasuryAccountAddress: new Pda(
    auctionHouseAccount.data.auctionHouseTreasury,
    auctionHouseAccount.data.treasuryBump
  ),
  feeWithdrawalDestinationAddress:
    auctionHouseAccount.data.feeWithdrawalDestination,
  treasuryWithdrawalDestinationAddress:
    auctionHouseAccount.data.treasuryWithdrawalDestination,
  sellerFeeBasisPoints: auctionHouseAccount.data.sellerFeeBasisPoints,
  requiresSignOff: auctionHouseAccount.data.requiresSignOff,
  canChangeSalePrice: auctionHouseAccount.data.canChangeSalePrice,
  isNative: treasuryMint.isWrappedSol,
});
