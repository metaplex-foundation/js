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
import { findAssociatedTokenAccountPda } from '@/programs';
import { Listing } from '@/plugins';

killStuckProcess();

test('[auctionHouseModule] create a new listing on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const { auctionHouse, client } = await createAuctionHouse(mx);

  // When we list that NFT for 6.5 SOL.
  const { listing, sellerTradeState } = await client
    .list({
      mintAccount: nft.mint,
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
      address: findAssociatedTokenAccountPda(nft.mint, mx.identity().publicKey),
      mint: {
        address: spokSamePubkey(nft.mint),
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
