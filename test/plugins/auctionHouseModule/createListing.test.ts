import test, { Test } from 'tape';
import { assertAccountExists, sol } from '@/types';
import { metaplex, killStuckProcess, createNft } from '../../helpers';
import { createAuctionHouse } from './helpers';
import { parseListingReceiptAccount } from '@/plugins';
import { makeLazyListingModel } from '@/plugins/auctionHouseModule/Listing';

killStuckProcess();

test('[auctionHouseModule] create a new listing on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const { auctionHouse, client } = await createAuctionHouse(mx);

  // When we list that NFT for 6.5 SOL.
  const output = await client
    .list({
      mintAccount: nft.mint,
      price: sol(6.5),
    })
    .run();

  // TODO(loris): implement Listing model.
  // TODO(loris): implement findListingByAddress(...).
  const receipt = await mx.rpc().getAccount(output.receipt);
  const parsedReceipt = parseListingReceiptAccount(receipt);
  assertAccountExists(parsedReceipt, 'ListingReceipt');
  const lazyListing = makeLazyListingModel(parsedReceipt, auctionHouse);

  const listing = await client.loadListing(lazyListing).run();
  console.log(listing);

  // TODO(loris): Then...
});
