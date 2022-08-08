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
import { Listing } from '@/plugins/auctionHouseModule';

killStuckProcess();

test('[auctionHouseModule] cancel a Listing on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();

  const nft = await createNft(mx);
  const { client } = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL.
  const { listing } = await client
    .list({
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // Then the trade state balance will have some SOL as a fee.
  const tradeStateFeeBalance = await mx
    .rpc()
    .getBalance(listing.tradeStateAddress);

  t.not(tradeStateFeeBalance.basisPoints.toNumber(), 0);
  t.notOk(listing.canceledAt);

  // And the NFT will have delegated authority.
  t.ok(listing.asset.token.delegateAddress);

  // When we cancel the given listing.
  const { listing: canceledListing } = await client
    .cancelListing({ listing })
    .run();

  // Then the delegate's authority is revoked and receipt has canceledAt date.
  t.notOk(canceledListing?.asset.token.delegateAddress);
  t.ok(canceledListing?.canceledAt);

  // And the trade state returns the fee to the fee payer.
  const updatedTradeStateFeeBalance = await mx
    .rpc()
    .getBalance((canceledListing as Listing).tradeStateAddress);

  t.equal(updatedTradeStateFeeBalance.basisPoints.toNumber(), 0);
});

test('[auctionHouseModule] cancel a Listing on an Auctioneer Auction House', async (t: Test) => {
  // Given we have an Auctioneer Auction House and an NFT.
  const mx = await metaplex();

  const nft = await createNft(mx);
  const auctioneerAuthority = Keypair.generate();
  const { client } = await createAuctionHouse(mx, auctioneerAuthority);

  // And we list that NFT.
  const { listing } = await client
    .list({
      mintAccount: nft.address,
    })
    .run();

  // When we cancel the given listing.
  await client.cancelListing({ listing }).run();

  // Then the trade state returns the fee to the fee payer.
  const updatedTradeStateFeeBalance = await mx
    .rpc()
    .getBalance(listing.tradeStateAddress);

  t.equal(updatedTradeStateFeeBalance.basisPoints.toNumber(), 0);
});

test('[auctionHouseModule] it throws an error if executing a sale with a canceled Listing', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const { client } = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL.
  const { listing } = await client
    .list({
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // And we put a public bid on that NFT for 1 SOL.
  const { bid } = await client
    .bid({
      buyer,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // And we cancel the given listing.
  const { listing: canceledListing } = await client
    .cancelListing({ listing })
    .run();

  // When we execute a sale with given canceled listing and bid.
  const promise = client
    .executeSale({ listing: canceledListing as Listing, bid })
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
  const { auctionHouse, client } = await createAuctionHouse(
    mx,
    auctioneerAuthority
  );

  // And we listed that NFT.
  const { listing } = await client
    .list({
      mintAccount: nft.address,
    })
    .run();

  // When we cancel the listing but without providing Auctioneer Authority.
  const promise = mx
    .auctions()
    .for(auctionHouse)
    .cancelListing({ listing })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /you have not provided the required "auctioneerAuthority" parameter/
  );
});
