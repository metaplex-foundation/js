import { ListingReceipt } from '@metaplex-foundation/mpl-auction-house';
import test, { Test } from 'tape';
import { parseAccount, sol } from '@/types';
import { metaplex, killStuckProcess, createNft } from '../../helpers';
import { createAuctionHouse } from './helpers';

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

  const foo = await mx.rpc().getAccount(output.receipt);
  const parsedFoo = parseAccount(foo, ListingReceipt);
  console.log(parsedFoo);

  // TODO(loris): Then...
});
