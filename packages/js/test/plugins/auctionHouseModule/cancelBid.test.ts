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

test('[auctionHouseModule] cancel a Private Bid on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();

  const nft = await createNft(mx);
  const { client } = await createAuctionHouse(mx);

  // And we put a private bid on that NFT for 1 SOL.
  const { bid } = await client
    .bid({
      mintAccount: nft.address,
      tokenAccount: nft.token.address,
      price: sol(1),
    })
    .run();

  t.false(bid.canceledAt);

  // When we cancel the given bid.
  await client.cancelBid({ bid }).run();

  // Then bid receipt has canceled at date.
  const canceledBid = await client
    .findBidByAddress(bid.tradeStateAddress)
    .run();
  t.ok(canceledBid.canceledAt);

  // And the trade state account no longer exists.
  const bidAccount = await mx.rpc().getAccount(bid.tradeStateAddress);
  t.false(bidAccount.exists, 'bid account no longer exists');
});

test('[auctionHouseModule] cancel a Public Bid on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();

  const nft = await createNft(mx);
  const { client } = await createAuctionHouse(mx);

  // And we put a public bid on that NFT for 1 SOL.
  const { bid } = await client
    .bid({
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // When we cancel the given bid.
  await client.cancelBid({ bid }).run();

  // And the trade state account no longer exists.
  const bidAccount = await mx.rpc().getAccount(bid.tradeStateAddress);
  t.false(bidAccount.exists, 'bid account no longer exists');
});

test('[auctionHouseModule] cancel a Private Bid on an Auctioneer Auction House', async (t: Test) => {
  // Given we have an Auctioneer Auction House and an NFT.
  const mx = await metaplex();

  const nft = await createNft(mx);
  const auctioneerAuthority = Keypair.generate();
  const { client } = await createAuctionHouse(mx, auctioneerAuthority);

  // And we put a private bid on that NFT for 1 SOL.
  const { bid } = await client
    .bid({
      mintAccount: nft.address,
      tokenAccount: nft.token.address,
      price: sol(1),
    })
    .run();

  // When we cancel the given bid.
  await client.cancelBid({ bid }).run();

  // Then the trade state returns the fee to the fee payer.
  const bidAccount = await mx.rpc().getAccount(bid.tradeStateAddress);
  t.false(bidAccount.exists, 'bid account no longer exists');
});

test('[auctionHouseModule] cancel a Public Bid on an Auctioneer Auction House', async (t: Test) => {
  // Given we have an Auctioneer Auction House and an NFT.
  const mx = await metaplex();

  const nft = await createNft(mx);
  const auctioneerAuthority = Keypair.generate();
  const { client } = await createAuctionHouse(mx, auctioneerAuthority);

  // And we put a public bid on that NFT for 1 SOL.
  const { bid } = await client
    .bid({
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // When we cancel the given bid.
  await client.cancelBid({ bid }).run();

  // Then the trade state returns the fee to the fee payer.
  const bidAccount = await mx.rpc().getAccount(bid.tradeStateAddress);
  t.false(bidAccount.exists, 'bid account no longer exists');
});

test('[auctionHouseModule] it throws an error if executing a sale with a canceled Bid', async (t: Test) => {
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

  // And we cancel the given bid.
  await client.cancelBid({ bid }).run();

  // When we execute a sale with given listing and canceled bid.
  const canceledBid = await client
    .findBidByAddress(bid.tradeStateAddress)
    .run();
  const promise = client.executeSale({ listing, bid: canceledBid }).run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /You are trying to execute a sale using a canceled Bid./
  );
});

test('[auctionHouseModule] it throws an error if Auctioneer Authority is not provided in Bid Cancel', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);

  const auctioneerAuthority = Keypair.generate();
  const { auctionHouse, client } = await createAuctionHouse(
    mx,
    auctioneerAuthority
  );

  // And we put a public bid on that NFT for 1 SOL.
  const { bid } = await client
    .bid({
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // When we cancel the bid but without providing Auctioneer Authority.
  const promise = mx.auctions().for(auctionHouse).cancelBid({ bid }).run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /you have not provided the required "auctioneerAuthority" parameter/
  );
});
