import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { sol } from '@/types';
import {
  metaplex,
  killStuckProcess,
  createNft,
  assertThrows,
  createWallet,
} from '../../helpers';
import { createAuctionHouse } from './helpers';

killStuckProcess();

test('[auctionHouseModule] cancel a Listing on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();

  const nft = await createNft(mx);
  const { auctionHouse } = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // The NFT will have delegated authority.
  t.ok(listing.asset.token.delegateAddress);

  // When we cancel the given listing.
  await mx.auctionHouse().cancelListing({ auctionHouse, listing }).run();

  // Then the delegate's authority is revoked and receipt has canceledAt date.
  const canceledListing = await mx
    .auctionHouse()
    .findListingByTradeState({
      tradeStateAddress: listing.tradeStateAddress,
      auctionHouse,
    })
    .run();
  t.false(canceledListing.asset.token.delegateAddress);
  t.ok(canceledListing.canceledAt);

  // And the trade state account no longer exists.
  const listingAccount = await mx.rpc().getAccount(listing.tradeStateAddress);
  t.false(listingAccount.exists, 'listing account no longer exists');
});

test('[auctionHouseModule] cancel a Listing on an Auctioneer Auction House', async (t: Test) => {
  // Given we have an Auctioneer Auction House and an NFT.
  const mx = await metaplex();

  const nft = await createNft(mx);
  const auctioneerAuthority = Keypair.generate();
  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority);

  // And we list that NFT.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      auctioneerAuthority,
      mintAccount: nft.address,
    })
    .run();

  // When we cancel the given listing.
  await mx
    .auctionHouse()
    .cancelListing({ auctionHouse, auctioneerAuthority, listing })
    .run();

  // Then the trade state account no longer exists.
  const listingAccount = await mx.rpc().getAccount(listing.tradeStateAddress);
  t.false(listingAccount.exists, 'listing account no longer exists');
});

test('[auctionHouseModule] it throws an error if executing a sale with a canceled Listing', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const { auctionHouse } = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // And we put a public bid on that NFT for 1 SOL.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // And we cancel the given listing.
  await mx.auctionHouse().cancelListing({ auctionHouse, listing }).run();

  // When we execute a sale with given canceled listing and bid.
  const canceledListing = await mx
    .auctionHouse()
    .findListingByTradeState({
      tradeStateAddress: listing.tradeStateAddress,
      auctionHouse,
    })
    .run();
  const promise = mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: canceledListing, bid })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /You are trying to execute a sale using a canceled Listing./
  );
});

test('[auctionHouseModule] it throws an error if Auctioneer Authority is not provided in Listing Cancel', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);

  const auctioneerAuthority = Keypair.generate();
  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority);

  // And we listed that NFT.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      auctioneerAuthority,
      mintAccount: nft.address,
    })
    .run();

  // When we cancel the listing but without providing Auctioneer Authority.
  const promise = mx
    .auctionHouse()
    .cancelListing({ auctionHouse, listing })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /you have not provided the required "auctioneerAuthority" parameter/
  );
});
