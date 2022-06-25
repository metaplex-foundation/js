import test, { Test } from 'tape';
import { sol } from '@/types';
import { metaplex, killStuckProcess, createNft } from '../../helpers';
import { createAuctionHouse } from './helpers';

killStuckProcess();

test.only('[auctionHouseModule] create a new listing on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const { client } = await createAuctionHouse(mx);

  // When we list that NFT for 6.5 SOL.
  try {
    const output = await client
      .list({
        mintAccount: nft.mint,
        price: sol(6.5),
        printReceipt: false,
      })
      .run();

    // TODO(loris): Then...
    console.log(output);
  } catch (error: any) {
    console.error(error);
  }
});
