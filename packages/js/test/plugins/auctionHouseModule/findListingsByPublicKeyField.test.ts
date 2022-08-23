import test from 'tape';
import { sol } from '@/types';

import { killStuckProcess, metaplex, createNft } from '../../helpers';
import { createAuctionHouse } from './helpers';

killStuckProcess();

test('[auctionHouseModule] find all listings by seller', async (t) => {
  // Given we have an Auction House and 2 NFTs.
  const mx = await metaplex();
  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);

  const { auctionHouse } = await createAuctionHouse(mx);

  // And given we create a listing on first NFT for 1 SOL.
  await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: firstNft.address,
      price: sol(1),
    })
    .run();

  // And given we create a listing on second NFT for 1 SOL.
  await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: secondNft.address,
      price: sol(1),
    })
    .run();

  // When I find all listings by seller.
  const listings = await mx
    .auctionHouse()
    .findListingsBy({
      type: 'seller',
      auctionHouse,
      publicKey: mx.identity().publicKey,
    })
    .run();

  // Then we got two listings for given seller.
  t.equal(listings.length, 2, 'returns two accounts');

  // And they both are from seller.
  listings.forEach((listing) => {
    t.ok(
      listing.sellerAddress.equals(mx.identity().publicKey),
      'wallet matches'
    );
  });
});

test('[auctionHouseModule] find all listings by metadata', async (t) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);

  const { auctionHouse } = await createAuctionHouse(mx);

  // And given we create a listing on first NFT for 1 SOL.
  await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: firstNft.address,
      price: sol(1),
    })
    .run();

  // And given we create a listing on second NFT for 1 SOL.
  await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: secondNft.address,
      price: sol(1),
    })
    .run();

  // When I find all listings by metadata.
  const listings = await mx
    .auctionHouse()
    .findListingsBy({
      type: 'metadata',
      auctionHouse,
      publicKey: firstNft.metadataAddress,
    })
    .run();

  // Then we got one listing.
  t.equal(listings.length, 1, 'returns one account');

  // And it is for given metadata.
  listings.forEach((bid) => {
    t.ok(
      bid.asset.metadataAddress.equals(firstNft.metadataAddress),
      'metadata matches'
    );
  });
});
