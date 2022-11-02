import test from 'tape';

import {
  killStuckProcess,
  metaplex,
  createNft,
  createWallet,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import { sol } from '@/types';
import { LazyListing } from '@/plugins';

killStuckProcess();

test('[auctionHouseModule] find all listings', async (t) => {
  // Given we have an Auction House and 2 NFTs.
  const mx = await metaplex();
  const secondSeller = await createWallet(mx);
  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);
  const thirdNft = await createNft(mx, { tokenOwner: secondSeller.publicKey });

  const auctionHouse = await createAuctionHouse(mx);

  // And given we create a listing on first NFT for 1 SOL.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: firstNft.address,
    price: sol(1),
  });

  // And given we create a listing on second NFT for 1 SOL.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: secondNft.address,
    price: sol(1),
  });

  // And given we create a listing on third NFT for 1 SOL from different wallet.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: thirdNft.address,
    seller: secondSeller,
    price: sol(1),
  });

  // When I find all listings.
  const listings = await mx.auctionHouse().findListings({
    auctionHouse,
  });

  // Then we got three lazy listings for given auction house.
  t.equal(listings.length, 3, 'returns three accounts');

  // And they are from this auction house.
  listings.forEach((listing) => {
    t.ok(
      listing.auctionHouse.address.equals(auctionHouse.address),
      'auction house matches'
    );
  });
});

test('[auctionHouseModule] find all lazy listings by seller', async (t) => {
  // Given we have an Auction House and 2 NFTs.
  const mx = await metaplex();
  const secondSeller = await createWallet(mx);
  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);
  const thirdNft = await createNft(mx, { tokenOwner: secondSeller.publicKey });

  const auctionHouse = await createAuctionHouse(mx);

  // And given we create a listing on first NFT for 1 SOL.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: firstNft.address,
    price: sol(1),
  });

  // And given we create a listing on second NFT for 1 SOL.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: secondNft.address,
    price: sol(1),
  });

  // And given we create a listing on third NFT for 1 SOL from different wallet.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: thirdNft.address,
    seller: secondSeller,
    price: sol(1),
  });

  // When I find all listings by seller.
  const listings = await mx.auctionHouse().findListings({
    auctionHouse,
    seller: mx.identity().publicKey,
  });

  // Then we got two lazy listings for given seller.
  t.equal(listings.length, 2, 'returns two accounts');

  // And they both are from seller.
  listings.forEach((listing) => {
    t.ok(
      listing.sellerAddress.equals(mx.identity().publicKey),
      'wallet matches'
    );
  });
});

test('[auctionHouseModule] find all lazy listings by metadata', async (t) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);

  const auctionHouse = await createAuctionHouse(mx);

  // And given we create a listing on first NFT for 1 SOL.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: firstNft.address,
    price: sol(1),
  });

  // And given we create a listing on second NFT for 1 SOL.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: secondNft.address,
    price: sol(1),
  });

  // When I find all listings by metadata.
  const listings = await mx.auctionHouse().findListings({
    auctionHouse,
    metadata: firstNft.metadataAddress,
  });

  // Then we got one lazy listing.
  t.equal(listings.length, 1, 'returns one account');

  // And it is for given metadata.
  listings.forEach((listing) => {
    t.ok(
      (listing as LazyListing).metadataAddress.equals(firstNft.metadataAddress),
      'metadata matches'
    );
  });
});

test('[auctionHouseModule] find all listings by mint', async (t) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);

  const auctionHouse = await createAuctionHouse(mx);

  // And given we create a listing on first NFT for 1 SOL.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: firstNft.address,
    price: sol(1),
  });

  // And given we create a listing on second NFT for 1 SOL.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: secondNft.address,
    price: sol(1),
  });

  // When I find all listings by mint.
  const listings = await mx.auctionHouse().findListings({
    auctionHouse,
    mint: firstNft.address,
  });

  // Then we got one listing.
  t.equal(listings.length, 1, 'returns one account');

  // And it is for given metadata.
  listings.forEach((listing) => {
    t.ok(
      (listing as LazyListing).metadataAddress.equals(firstNft.metadataAddress),
      'metadata matches'
    );
  });
});

test('[auctionHouseModule] when finding all lazy listings by seller, metadata & mint then metadata criteria is ignored', async (t) => {
  // Given we have an Auction House and 2 NFTs.
  const mx = await metaplex();
  const secondSeller = await createWallet(mx);
  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);
  const thirdNft = await createNft(mx, { tokenOwner: secondSeller.publicKey });

  const auctionHouse = await createAuctionHouse(mx);

  // And given we create a listing on first NFT for 1 SOL.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: firstNft.address,
    price: sol(1),
  });

  // And given we create a listing on second NFT for 1 SOL.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: secondNft.address,
    price: sol(1),
  });

  // And given we create a listing on third NFT for 1 SOL from different wallet.
  await mx.auctionHouse().list({
    auctionHouse,
    mintAccount: thirdNft.address,
    seller: secondSeller,
    price: sol(1),
  });

  // When I find all listings by seller, metadata and mint.
  const listings = await mx.auctionHouse().findListings({
    auctionHouse,
    seller: mx.identity().publicKey,
    metadata: secondNft.metadataAddress,
    mint: firstNft.address,
  });

  // Then we got only one lazy listing for given seller and mint.
  t.equal(listings.length, 1, 'returns one account');

  // And it's from seller and mint while metadata is ignored.
  listings.forEach((listing) => {
    t.ok(
      listing.sellerAddress.equals(mx.identity().publicKey),
      'wallet matches'
    );
    t.ok(
      (listing as LazyListing).metadataAddress.equals(firstNft.metadataAddress),
      'metadata from mint matches'
    );
    t.not(
      (listing as LazyListing).metadataAddress.equals(
        secondNft.metadataAddress
      ),
      'provided metadata filter is not used'
    );
  });
});
