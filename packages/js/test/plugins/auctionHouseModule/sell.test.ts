import test, { Test } from 'tape';
import { sol, token } from '@/types';
import {
  createNft,
  createWallet,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSamePubkey,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import { findAssociatedTokenAccountPda, Purchase } from '@/plugins';
import spok, { Specifications } from 'spok';

killStuckProcess();

test('[auctionHouseModule] instant sale on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const { auctionHouse } = await createAuctionHouse(mx);

  // And we put a public bid on that NFT for 1 SOL.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: nft.address,
      seller: mx.identity().publicKey,
      price: sol(1),
    })
    .run();

  // Then we execute an Sell on the bid
  const { purchase } = await mx
    .auctionHouse()
    .sell({ auctionHouse, bid })
    .run();

  // Then we created and returned the new Purchase with appropriate values.
  const expectedPurchase = {
    price: spokSameAmount(sol(1)),
    tokens: spokSameAmount(token(1)),
    buyerAddress: spokSamePubkey(buyer.publicKey),
    sellerAddress: spokSamePubkey(mx.identity().publicKey),
    auctionHouse: {
      address: spokSamePubkey(auctionHouse.address),
    },
    asset: {
      address: spokSamePubkey(nft.address),
      token: {
        address: findAssociatedTokenAccountPda(nft.address, buyer.publicKey),
        ownerAddress: spokSamePubkey(buyer.publicKey),
      },
    },
    receiptAddress: spok.defined,
  };
  spok(t, purchase, {
    $topic: 'Purchase',
    ...expectedPurchase,
  } as unknown as Specifications<Purchase>);
});
