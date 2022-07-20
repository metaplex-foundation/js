import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { sol, token } from '@/types';
import {
  metaplex,
  killStuckProcess,
  createNft,
  spokSamePubkey,
  spokSameAmount,
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
      mintAccount: nft.mintAddress,
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
    token: {
      address: findAssociatedTokenAccountPda(
        nft.mintAddress,
        mx.identity().publicKey
      ),
      mint: {
        address: spokSamePubkey(nft.mintAddress),
      },
    },
  };
  spok(t, listing, {
    $topic: 'Listing',
    ...expectedListing,
  } as unknown as Specifications<Listing>);

  // And we get the same result when we fetch the Auction House by address.
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
      mintAccount: nft.mintAddress,
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
