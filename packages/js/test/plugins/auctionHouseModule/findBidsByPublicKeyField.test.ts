import test from 'tape';
import { sol } from '@/types';

import {
  killStuckProcess,
  metaplex,
  createNft,
  createWallet,
} from '../../helpers';
import { createAuctionHouse } from './helpers';

killStuckProcess();

test('[auctionHouseModule] find all bids by buyer', async (t) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, { tokenOwner: seller.publicKey });

  const { auctionHouse } = await createAuctionHouse(mx);

  // And given we create a public bid on that NFT for 6.5 SOL.
  await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(6.5),
    })
    .run();

  // And given we create another public bid on that NFT for 1 SOL.
  await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // When I find all bids by buyer.
  const bids = await mx
    .auctionHouse()
    .findBidsBy({
      type: 'buyer',
      auctionHouse,
      publicKey: mx.identity().publicKey,
    })
    .run();

  // Then we got two bids for given buyer.
  t.equal(bids.length, 2, 'returns two accounts');

  // And they both are from buyer.
  bids.forEach((bid) => {
    t.ok(bid.buyerAddress.equals(mx.identity().publicKey), 'wallet matches');
  });
});

test('[auctionHouseModule] find all bids by metadata', async (t) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, { tokenOwner: seller.publicKey });

  const { auctionHouse } = await createAuctionHouse(mx);

  // And given we create a public bid on that NFT for 6.5 SOL.
  await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(6.5),
    })
    .run();

  // And given we create another public bid using different wallet on that NFT for 1 SOL.
  await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // When I find all bids by metadata.
  const bids = await mx
    .auctionHouse()
    .findBidsBy({
      type: 'metadata',
      auctionHouse,
      publicKey: nft.metadataAddress,
    })
    .run();

  // Then we got two bids.
  t.equal(bids.length, 2, 'returns two accounts');

  // And they both are for given metadata.
  bids.forEach((bid) => {
    t.ok(
      bid.asset.metadataAddress.equals(nft.metadataAddress),
      'metadata matches'
    );
  });
});

test('[auctionHouseModule] find all bids by mint', async (t) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, { tokenOwner: seller.publicKey });

  const { auctionHouse } = await createAuctionHouse(mx);

  // And given we create a public bid on that NFT for 6.5 SOL.
  await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(6.5),
    })
    .run();

  // And given we create another public bid using different wallet on that NFT for 1 SOL.
  await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // When I find all bids by mint.
  const bids = await mx
    .auctionHouse()
    .findBidsBy({
      type: 'mint',
      auctionHouse,
      publicKey: nft.address,
    })
    .run();

  // Then we got two bids.
  t.equal(bids.length, 2, 'returns two accounts');

  // And they both are from given mint.
  bids.forEach((bid) => {
    t.ok(
      bid.asset.address.equals(nft.address),
      'mint matches'
    );
  });
});