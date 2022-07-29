import test, { Test } from 'tape';
import { sol, toPublicKey } from '@/types';
import {
  metaplex,
  killStuckProcess,
  createNft,
  createWallet,
} from '../../helpers';
import { createAuctionHouse } from './helpers';

killStuckProcess();

test('[auctionHouseModule] execute sale on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const { client } = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL.
  const { sellerTradeState } = await client
    .list({
      mintAccount: nft.mintAddress,
      price: sol(1),
    })
    .run();

  // And we created a private bid on that NFT for 1 SOL.
  const { buyerTradeState } = await client
    .bid({
      buyer,
      mintAccount: nft.mintAddress,
      seller: mx.identity().publicKey,
      price: sol(1),
    })
    .run();

  // When we execute a sale with given listing and bid.
  await client
    .executeSale({
      buyer: toPublicKey(buyer),
      mintAccount: nft.mintAddress,
      sellerTradeState,
      buyerTradeState,
      price: sol(1),
      confirmOptions: { skipPreflight: true },
    })
    .run();
});
