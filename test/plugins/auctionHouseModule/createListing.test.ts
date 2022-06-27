import test, { Test } from 'tape';
import { sol } from '@/types';
import { metaplex, killStuckProcess, createNft } from '../../helpers';
import { createAuctionHouse } from './helpers';
import { parseListingReceiptAccount } from '@/plugins';

killStuckProcess();

test.only('[auctionHouseModule] create a new listing on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const { client } = await createAuctionHouse(mx);

  // When we list that NFT for 6.5 SOL.
  const output = await client
    .list({
      mintAccount: nft.mint,
      price: sol(6.5),
    })
    .run();

  // TODO(loris): implement ListingReceipt model. Type?
  // TODO(loris): implement findListingReceiptByAddress(...).
  const receipt = await mx.rpc().getAccount(output.receipt);
  const parsedReceipt = parseListingReceiptAccount(receipt);
  console.log(parsedReceipt);

  // TODO(loris): Then...
});
