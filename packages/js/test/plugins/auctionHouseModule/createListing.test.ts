import { AuthorityScope } from '@metaplex-foundation/mpl-auction-house';
import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { sol, token } from '@/types';
import {
  metaplex,
  killStuckProcess,
  createNft,
  spokSamePubkey,
  spokSameAmount,
  assertThrows,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import {
  findAssociatedTokenAccountPda,
  Listing,
  AccountNotFoundError,
} from '@/index';

killStuckProcess();

test('[auctionHouseModule] create a new listing on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const { auctionHouse, client } = await createAuctionHouse(mx);

  // When we list that NFT for 6.5 SOL.
  const { listing, sellerTradeState } = await client
    .list({
      mintAccount: nft.address,
      price: sol(6.5),
    })
    .run();

  // Then we created and returned the new Listing with appropriate defaults.
  const expectedListing = {
    tradeStateAddress: spokSamePubkey(sellerTradeState),
    price: spokSameAmount(sol(6.5)),
    tokens: spokSameAmount(token(1)),
    auctionHouse: {
      address: spokSamePubkey(auctionHouse.address),
    },
    asset: {
      model: 'nft',
      address: spokSamePubkey(nft.address),
      token: {
        address: findAssociatedTokenAccountPda(
          nft.address,
          mx.identity().publicKey
        ),
      },
    },
  };
  spok(t, listing, {
    $topic: 'Listing',
    ...expectedListing,
  } as unknown as Specifications<Listing>);

  // And we get the same result when we fetch the Listing by address.
  const retrieveListing = await client
    .findListingByAddress(sellerTradeState)
    .run();
  spok(t, retrieveListing, {
    $topic: 'Retrieved Listing',
    ...expectedListing,
  } as unknown as Specifications<Listing>);
});

test('[auctionHouseModule] create receipt-less listings but can fetch them afterwards by default', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const { client } = await createAuctionHouse(mx);

  // When we list that NFT without printing a receipt.
  const { listing, sellerTradeState } = await client
    .list({
      mintAccount: nft.address,
      price: sol(1),
      printReceipt: false,
    })
    .run();

  // Then we still get a listing model.
  t.equal(listing.tradeStateAddress, sellerTradeState);
  t.same(listing.price, sol(1));
  t.same(listing.tokens, token(1));

  // But we cannot retrieve it later with the default operation handler.
  try {
    await client.findListingByAddress(sellerTradeState).run();
    t.fail('expected to throw AccountNotFoundError');
  } catch (error: any) {
    const hasNotFoundMessage = error.message.includes(
      'The account of type [ListingReceipt] was not found'
    );
    t.ok(error instanceof AccountNotFoundError, 'throws AccountNotFoundError');
    t.ok(hasNotFoundMessage, 'has ListingReceipt Not Found message');
  }
});

test('[auctionHouseModule] create a new receipt-less Auctioneer listing on an Auction House', async (t: Test) => {
  // Given we have an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);

  const auctioneerAuthority = Keypair.generate();

  // Create a simple Auctioneer Auction House.
  const { client } = await createAuctionHouse(mx, auctioneerAuthority);

  // When we list that NFT.
  const { listing, sellerTradeState } = await client
    .list({
      mintAccount: nft.address,
    })
    .run();

  // Then we still get a listing model.
  t.equal(listing.tradeStateAddress, sellerTradeState);
});

test('[auctionHouseModule] create a new receipt-less Auctioneer listing on an Auction House with late Auctioneer delegation', async (t: Test) => {
  // Given we have an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);

  const auctioneerAuthority = Keypair.generate();

  // Create a simple Auction House.
  const { auctionHouse } = await createAuctionHouse(mx);
  // Delegate Auctioneer on update.
  const { auctionHouse: updatedAuctionHouse } = await mx
    .auctions()
    .updateAuctionHouse(auctionHouse, {
      auctioneerAuthority: auctioneerAuthority.publicKey,
    })
    .run();
  // Get a client for updated Auction House.
  const client = mx.auctions().for(updatedAuctionHouse, auctioneerAuthority);

  // When we list that NFT.
  const { listing, sellerTradeState } = await client
    .list({
      mintAccount: nft.address,
    })
    .run();

  // Then we still get a listing model.
  t.equal(listing.tradeStateAddress, sellerTradeState);
});

test('[auctionHouseModule] it throws an error if Sell is not included in Auctioneer scopes', async (t: Test) => {
  // Given we have an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);

  const auctioneerAuthority = Keypair.generate();

  // Create Auctioneer Auction House to only allow Buy.
  const { client } = await createAuctionHouse(mx, auctioneerAuthority, {
    auctioneerScopes: [AuthorityScope.Buy],
  });

  // When we list that NFT.
  const promise = client
    .list({
      mintAccount: nft.address,
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /The Auctioneer does not have the correct scope for this action/
  );
});

test('[auctionHouseModule] it allows to List after Auctioneer scope update', async (t: Test) => {
  // Given we have an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);

  const auctioneerAuthority = Keypair.generate();

  // Create Auctioneer Auction House to only allow Buy.
  const { auctionHouse, client } = await createAuctionHouse(
    mx,
    auctioneerAuthority,
    {
      auctioneerScopes: [AuthorityScope.Buy],
    }
  );

  // When we update scope to allow Listing.
  await mx
    .auctions()
    .updateAuctionHouse(auctionHouse, {
      auctioneerAuthority: auctioneerAuthority.publicKey,
      auctioneerScopes: [AuthorityScope.Sell, AuthorityScope.Buy],
    })
    .run();

  // When we list that NFT.
  const { listing, sellerTradeState } = await client
    .list({
      mintAccount: nft.address,
    })
    .run();

  // Then we still get a listing model.
  t.equal(listing.tradeStateAddress, sellerTradeState);
});

test('[auctionHouseModule] it throws an error if Auctioneer Authority is not provided in Auctioneer Listing', async (t: Test) => {
  // Given we have an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);

  const auctioneerAuthority = Keypair.generate();

  // Create Auctioneer Auction House.
  const { auctionHouse } = await mx
    .auctions()
    .createAuctionHouse({
      sellerFeeBasisPoints: 200,
      auctioneerAuthority: auctioneerAuthority.publicKey,
    })
    .run();
  // Create a client for Auction House, but don't provide auctioneerAuthority.
  const client = mx.auctions().for(auctionHouse);

  // When we list that NFT.
  const promise = client
    .list({
      mintAccount: nft.address,
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /you have not provided the required "auctioneerAuthority" parameter/
  );
});
