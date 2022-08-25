import test from 'tape';
import { sol } from '@/types';

import {
  killStuckProcess,
  metaplex,
  createNft,
  createWallet,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import { LazyPurchase, Purchase } from '@/plugins';

killStuckProcess();

test('[auctionHouseModule] find all lazy purchases by buyer', async (t) => {
  // Given we have an Auction House and 2 NFTs.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);

  const { auctionHouse } = await createAuctionHouse(mx);

  // And given we execute sale on first NFT for 1 SOL.
  const { listing: firstListing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: firstNft.address,
      price: sol(1),
    })
    .run();

  const { bid: firstBid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: firstNft.address,
      seller: mx.identity().publicKey,
      price: sol(1),
    })
    .run();

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: firstListing, bid: firstBid })
    .run();

  // And given we execute sale on second NFT for 1 SOL.
  const { listing: secondListing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: secondNft.address,
      price: sol(1),
    })
    .run();

  const { bid: secondBid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: secondNft.address,
      seller: mx.identity().publicKey,
      price: sol(1),
    })
    .run();

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: secondListing, bid: secondBid })
    .run();

  // When I find all lazy purchases by buyer.
  const purchases = await mx
    .auctionHouse()
    .findPurchasesBy({
      type: 'buyer',
      auctionHouse,
      publicKey: buyer.publicKey,
    })
    .run();

  // Then we got two lazy purchases for given buyer.
  t.equal(purchases.length, 2, 'returns two accounts');

  // And they both are from buyer.
  purchases.forEach((purchase) => {
    t.ok(purchase.buyerAddress.equals(buyer.publicKey), 'buyer matches');
  });
});

test('[auctionHouseModule] find all lazy purchases by seller', async (t) => {
  // Given we have an Auction House and 2 NFTs.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);

  const { auctionHouse } = await createAuctionHouse(mx);

  // And given we execute sale on first NFT for 1 SOL.
  const { listing: firstListing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: firstNft.address,
      price: sol(1),
    })
    .run();

  const { bid: firstBid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: firstNft.address,
      seller: mx.identity().publicKey,
      price: sol(1),
    })
    .run();

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: firstListing, bid: firstBid })
    .run();

  // And given we execute sale on second NFT for 1 SOL.
  const { listing: secondListing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: secondNft.address,
      price: sol(1),
    })
    .run();

  const { bid: secondBid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: secondNft.address,
      seller: mx.identity().publicKey,
      price: sol(1),
    })
    .run();

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: secondListing, bid: secondBid })
    .run();

  // When I find all lazy purchases by seller.
  const purchases = await mx
    .auctionHouse()
    .findPurchasesBy({
      type: 'seller',
      auctionHouse,
      publicKey: mx.identity().publicKey,
    })
    .run();

  // Then we got two lazy purchases for given seller.
  t.equal(purchases.length, 2, 'returns two accounts');

  // And they both are from seller.
  purchases.forEach((purchase) => {
    t.ok(
      purchase.sellerAddress.equals(mx.identity().publicKey),
      'seller matches'
    );
  });
});

test('[auctionHouseModule] find all lazy purchases by metadata', async (t) => {
  // Given we have an Auction House and 2 NFTs.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);

  const { auctionHouse } = await createAuctionHouse(mx);

  // And given we execute sale on first NFT for 1 SOL.
  const { listing: firstListing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: firstNft.address,
      price: sol(1),
    })
    .run();

  const { bid: firstBid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: firstNft.address,
      seller: mx.identity().publicKey,
      price: sol(1),
    })
    .run();

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: firstListing, bid: firstBid })
    .run();

  // And given we execute sale on second NFT for 1 SOL.
  const { listing: secondListing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: secondNft.address,
      price: sol(1),
    })
    .run();

  const { bid: secondBid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: secondNft.address,
      seller: mx.identity().publicKey,
      price: sol(1),
    })
    .run();

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: secondListing, bid: secondBid })
    .run();

  // When I find all lazy purchases by metadata.
  const purchases = await mx
    .auctionHouse()
    .findPurchasesBy({
      type: 'metadata',
      auctionHouse,
      publicKey: firstNft.metadataAddress,
    })
    .run();

  // Then we got one lazy purchase for given nft.
  t.equal(purchases.length, 1, 'returns one account');

  // And it is from given metadata.
  purchases.forEach((purchase) => {
    t.ok(
      (purchase as LazyPurchase).metadataAddress.equals(
        firstNft.metadataAddress
      ),
      'metadata matches'
    );
  });
});

test('[auctionHouseModule] find all purchases by mint', async (t) => {
  // Given we have an Auction House and 2 NFTs.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);

  const { auctionHouse } = await createAuctionHouse(mx);

  // And given we execute sale on first NFT for 1 SOL.
  const { listing: firstListing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: firstNft.address,
      price: sol(1),
    })
    .run();

  const { bid: firstBid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: firstNft.address,
      seller: mx.identity().publicKey,
      price: sol(1),
    })
    .run();

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: firstListing, bid: firstBid })
    .run();

  // And given we execute sale on second NFT for 1 SOL.
  const { listing: secondListing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: secondNft.address,
      price: sol(1),
    })
    .run();

  const { bid: secondBid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: secondNft.address,
      seller: mx.identity().publicKey,
      price: sol(1),
    })
    .run();

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: secondListing, bid: secondBid })
    .run();

  // When I find all purchases by mint.
  const purchases = await mx
    .auctionHouse()
    .findPurchasesBy({
      type: 'mint',
      auctionHouse,
      publicKey: firstNft.address,
      lazy: false,
    })
    .run();

  // Then we got one purchase for given nft.
  t.equal(purchases.length, 1, 'returns one account');

  // And it is from given metadata.
  purchases.forEach((purchase) => {
    t.ok(
      (purchase as Purchase).asset.address.equals(firstNft.address),
      'mint matches'
    );
  });
});
