import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { sol, token } from '@/types';
import {
  metaplex,
  killStuckProcess,
  createNft,
  createWallet,
  spokSamePubkey,
  spokSameAmount,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import { findAssociatedTokenAccountPda, Purchase } from '@/index';

killStuckProcess();

test('[auctionHouseModule] execute sale on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const { auctionHouse, client } = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL.
  const { listing, sellerTradeState } = await client
    .list({
      mintAccount: nft.mintAddress,
      price: sol(1),
    })
    .run();

  // And we created a private bid on that NFT for 1 SOL.
  const { bid, buyerTradeState } = await client
    .bid({
      buyer,
      mintAccount: nft.mintAddress,
      seller: mx.identity().publicKey,
      price: sol(1),
    })
    .run();

  // When we execute a sale with given listing and bid.
  const { purchase } = await client.executeSale({ listing, bid }).run();

  // Then we created and returned the new Purchase with appropriate values.
  const expectedPurchase = {
    price: spokSameAmount(sol(1)),
    tokens: spokSameAmount(token(1)),
    buyerAddress: spokSamePubkey(buyer.publicKey),
    sellerAddress: spokSamePubkey(mx.identity().publicKey),
    auctionHouse: {
      address: spokSamePubkey(auctionHouse.address),
    },
    token: {
      address: findAssociatedTokenAccountPda(nft.mintAddress, buyer.publicKey),
      mint: {
        address: spokSamePubkey(nft.mintAddress),
      },
    },
  };
  spok(t, purchase, {
    $topic: 'Purchase',
    ...expectedPurchase,
  } as unknown as Specifications<Purchase>);

  // And we get the same result when we fetch the Purchase by address.
  const retrievePurchase = await client
    .findPurchaseByAddress(sellerTradeState, buyerTradeState)
    .run();
  spok(t, retrievePurchase, {
    $topic: 'Retrieved Purchase',
    ...expectedPurchase,
  } as unknown as Specifications<Purchase>);
});
