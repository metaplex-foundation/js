import test from 'tape';

import {
  killStuckProcess,
  metaplex,
  createNft,
  createWallet,
  assertThrows,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import { sol } from '@/types';
import { LazyPurchase } from '@/plugins';

killStuckProcess();

test('[auctionHouseModule] find all purchases in auction house', async (t) => {
  // Given we have an Auction House and 2 NFTs.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);

  const auctionHouse = await createAuctionHouse(mx);

  // And given we execute sale on first NFT for 1 SOL.
  const { listing: firstListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: firstNft.address,
    price: sol(1),
  });

  const { bid: firstBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: firstNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: firstListing, bid: firstBid });

  // And given we execute sale on second NFT for 1 SOL.
  const { listing: secondListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: secondNft.address,
    price: sol(1),
  });

  const { bid: secondBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: secondNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: secondListing, bid: secondBid });

  // When I find all purchases.
  const purchases = await mx.auctionHouse().findPurchases({
    auctionHouse,
  });

  // Then we got 2 purchases for given auction house.
  t.equal(purchases.length, 2, 'returns 2 accounts');

  // And it is from given auction house.
  purchases.forEach((purchase) => {
    t.ok(
      (purchase as LazyPurchase).auctionHouse.address.equals(
        auctionHouse.address
      ),
      'auction house matches'
    );
  });
});

test('[auctionHouseModule] find all lazy purchases by buyer', async (t) => {
  // Given we have an Auction House and 2 NFTs.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const secondBuyer = await createWallet(mx);

  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);
  const thirdNft = await createNft(mx);

  const auctionHouse = await createAuctionHouse(mx);

  // And given we execute sale on first NFT for 1 SOL.
  const { listing: firstListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: firstNft.address,
    price: sol(1),
  });

  const { bid: firstBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: firstNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: firstListing, bid: firstBid });

  // And given we execute sale on second NFT for 1 SOL.
  const { listing: secondListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: secondNft.address,
    price: sol(1),
  });

  const { bid: secondBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: secondNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: secondListing, bid: secondBid });

  // And given we execute sale on third NFT from second buyer for 1 SOL.
  const { listing: thirdListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: thirdNft.address,
    price: sol(1),
  });

  const { bid: thirdBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer: secondBuyer,
    mintAccount: thirdNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: thirdListing, bid: thirdBid });

  // When I find all lazy purchases by first buyer.
  const purchases = await mx.auctionHouse().findPurchases({
    auctionHouse,
    buyer: buyer.publicKey,
  });

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
  const secondSeller = await createWallet(mx);
  const buyer = await createWallet(mx);

  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);
  const thirdNft = await createNft(mx, { tokenOwner: secondSeller.publicKey });

  const auctionHouse = await createAuctionHouse(mx);

  // And given we execute sale on first NFT for 1 SOL.
  const { listing: firstListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: firstNft.address,
    price: sol(1),
  });

  const { bid: firstBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: firstNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: firstListing, bid: firstBid });

  // And given we execute sale on second NFT for 1 SOL.
  const { listing: secondListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: secondNft.address,
    price: sol(1),
  });

  const { bid: secondBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: secondNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: secondListing, bid: secondBid });

  // And given we execute sale on third NFT from different seller for 1 SOL.
  const { listing: thirdListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: thirdNft.address,
    seller: secondSeller,
    price: sol(1),
  });

  const { bid: thirdBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: thirdNft.address,
    seller: secondSeller.publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: thirdListing, bid: thirdBid });

  // When I find all lazy purchases by seller.
  const purchases = await mx.auctionHouse().findPurchases({
    auctionHouse,
    seller: mx.identity().publicKey,
  });

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

  const auctionHouse = await createAuctionHouse(mx);

  // And given we execute sale on first NFT for 1 SOL.
  const { listing: firstListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: firstNft.address,
    price: sol(1),
  });

  const { bid: firstBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: firstNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: firstListing, bid: firstBid });

  // And given we execute sale on second NFT for 1 SOL.
  const { listing: secondListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: secondNft.address,
    price: sol(1),
  });

  const { bid: secondBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: secondNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: secondListing, bid: secondBid });

  // When I find all lazy purchases by metadata.
  const purchases = await mx.auctionHouse().findPurchases({
    auctionHouse,
    metadata: firstNft.metadataAddress,
  });

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

  const auctionHouse = await createAuctionHouse(mx);

  // And given we execute sale on first NFT for 1 SOL.
  const { listing: firstListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: firstNft.address,
    price: sol(1),
  });

  const { bid: firstBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: firstNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: firstListing, bid: firstBid });

  // And given we execute sale on second NFT for 1 SOL.
  const { listing: secondListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: secondNft.address,
    price: sol(1),
  });

  const { bid: secondBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: secondNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: secondListing, bid: secondBid });

  // When I find all purchases by mint.
  const purchases = await mx.auctionHouse().findPurchases({
    auctionHouse,
    mint: firstNft.address,
  });

  // Then we got one purchase for given nft.
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

test('[auctionHouseModule] find all lazy purchases by buyer and metadata', async (t) => {
  // Given we have an Auction House and 2 NFTs.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const secondBuyer = await createWallet(mx);
  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);
  const thirdNft = await createNft(mx);

  const auctionHouse = await createAuctionHouse(mx);

  // And given we execute sale on first NFT for 1 SOL.
  const { listing: firstListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: firstNft.address,
    price: sol(1),
  });

  const { bid: firstBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: firstNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: firstListing, bid: firstBid });

  // And given we execute sale on second NFT for 1 SOL.
  const { listing: secondListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: secondNft.address,
    price: sol(1),
  });

  const { bid: secondBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: secondNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: secondListing, bid: secondBid });

  // And given we execute sale on third NFT for 1 SOL using different wallet.
  const { listing: thirdListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: thirdNft.address,
    price: sol(1),
  });

  const { bid: thirdBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer: secondBuyer,
    mintAccount: thirdNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: thirdListing, bid: thirdBid });

  // When I find all lazy purchases by buyer, seller and metadata.
  const purchases = await mx.auctionHouse().findPurchases({
    auctionHouse,
    metadata: firstNft.metadataAddress,
    buyer: buyer.publicKey,
  });

  // Then we a lazy purchase for given buyer and metadata.
  t.equal(purchases.length, 1, 'returns one account');

  // And it is from given metadata, buyer and seller.
  purchases.forEach((purchase) => {
    t.ok(
      (purchase as LazyPurchase).metadataAddress.equals(
        firstNft.metadataAddress
      ),
      'metadata matches'
    );
    t.ok(
      (purchase as LazyPurchase).buyerAddress.equals(buyer.publicKey),
      'buyer matches'
    );
  });
});

test('[auctionHouseModule] it throws when providing 4 filters', async (t) => {
  // Given we have an Auction House and 2 NFTs.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const firstNft = await createNft(mx);

  const auctionHouse = await createAuctionHouse(mx);

  // And given we execute sale on first NFT for 1 SOL.
  const { listing: firstListing } = await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: firstNft.address,
    price: sol(1),
  });

  const { bid: firstBid } = await mx.auctionHouse().bid({
    auctionHouse,
    buyer,
    mintAccount: firstNft.address,
    seller: mx.identity().publicKey,
    price: sol(1),
  });

  await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing: firstListing, bid: firstBid });

  // When I find all lazy purchases by auction house, buyer, seller and metadata.
  const promise = mx.auctionHouse().findPurchases({
    auctionHouse,
    metadata: firstNft.metadataAddress,
    buyer: buyer.publicKey,
    seller: mx.identity().publicKey,
  });

  // Then we expect an error. Because it's only possible to provide 3 filters at the same time.
  await assertThrows(t, promise, /FindAllSupportsOnlyThreeFiltersMaxError/);
});
