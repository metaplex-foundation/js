import { AuthorityScope } from '@metaplex-foundation/mpl-auction-house';
import type { PublicKey } from '@solana/web3.js';
import { Pda } from '@/types';
import { AuctioneerAccount, AuctionHouseAccount } from './accounts';
import { assert } from '@/utils';
import { Mint } from '../tokenModule';

export type AuctionHouse = Readonly<
  {
    model: 'auctionHouse';
    address: Pda;
    creatorAddress: PublicKey;
    authorityAddress: PublicKey;
    treasuryMint: Mint;
    feeAccountAddress: Pda;
    treasuryAccountAddress: Pda;
    feeWithdrawalDestinationAddress: PublicKey;
    treasuryWithdrawalDestinationAddress: PublicKey;
    sellerFeeBasisPoints: number;
    requiresSignOff: boolean;
    canChangeSalePrice: boolean;
    isNative: boolean;
  } & (
    | { hasAuctioneer: false }
    | {
        hasAuctioneer: true;
        auctioneer: {
          address: PublicKey;
          authority: PublicKey;
          scopes: AuthorityScope[];
        };
      }
  )
>;

export const isAuctionHouse = (value: any): value is AuctionHouse =>
  typeof value === 'object' && value.model === 'auctionHouse';

export function assertAuctionHouse(value: any): asserts value is AuctionHouse {
  assert(isAuctionHouse(value), `Expected AuctionHouse type`);
}

export type AuctioneerAuctionHouse = AuctionHouse & {
  hasAuctioneer: true;
};

export const isAuctioneerAuctionHouse = (
  value: any
): value is AuctioneerAuctionHouse =>
  isAuctionHouse(value) && value.hasAuctioneer;

export function assertAuctioneerAuctionHouse(
  value: any
): asserts value is AuctioneerAuctionHouse {
  assert(
    isAuctioneerAuctionHouse(value),
    `Expected AuctioneerAuctionHouse type`
  );
}

export const toAuctionHouse = (
  auctionHouseAccount: AuctionHouseAccount,
  treasuryMint: Mint,
  auctioneerAccount?: AuctioneerAccount | null
): AuctionHouse => {
  if (auctionHouseAccount.data.hasAuctioneer) {
    assert(
      !!auctioneerAccount,
      'Auctioneer account is required when hasAuctioneer is true'
    );
    assert(
      !!auctioneerAccount &&
        auctioneerAccount.data.auctionHouse.equals(
          auctionHouseAccount.publicKey
        ),
      'Auctioneer account does not match the AuctionHouse account'
    );
  }

  return {
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

    // Auctioneer.
    ...(auctionHouseAccount.data.hasAuctioneer && auctioneerAccount
      ? {
          hasAuctioneer: true,
          auctioneer: {
            address: auctioneerAccount.publicKey,
            authority: auctioneerAccount.data.auctioneerAuthority,
            scopes: auctioneerAccount.data.scopes.reduce<number[]>(
              (acc, isAllowed, index) => (isAllowed ? [...acc, index] : acc),
              [] as number[]
            ),
          },
        }
      : { hasAuctioneer: false }),
  };
};
