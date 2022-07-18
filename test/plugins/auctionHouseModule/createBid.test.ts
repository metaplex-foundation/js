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
import { findAssociatedTokenAccountPda } from '@/plugins';
import { Bid } from '@/plugins/auctionHouseModule/Bid';
import { AccountNotFoundError } from '@/errors';

killStuckProcess();

test('[auctionHouseModule] create a new bid on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const { auctionHouse, client } = await createAuctionHouse(mx);

  // When we list that NFT for 6.5 SOL.
  await client
    .list({
      mintAccount: nft.mintAddress,
      price: sol(6.5),
    })
    .run();

  const { bid, buyerTradeState } = await client
    .bid({
      mintAccount: nft.mintAddress,
      price: sol(6.5),
    })
    .run();

  // Then we created and returned the new Bid with appropriate defaults.
  const expectedBid = {
    tradeStateAddress: spokSamePubkey(buyerTradeState),
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
  spok(t, bid, {
    $topic: 'Bid',
    ...expectedBid,
  } as unknown as Specifications<Bid>);

  // And we get the same result when we fetch the Auction House by address.
  const retrieveBid = await client.findBidByAddress(buyerTradeState).run();
  spok(t, retrieveBid, {
    $topic: 'Retrieved Bid',
    ...expectedBid,
  } as unknown as Specifications<Bid>);
});

test('[auctionHouseModule] create receipt-less bid but can fetch them afterwards by default', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const { client } = await createAuctionHouse(mx);

  // When we list that NFT without printing a receipt.
  await client
    .list({
      mintAccount: nft.mintAddress,
      price: sol(1),
    })
    .run();

  const { bid, buyerTradeState } = await client
    .bid({
      mintAccount: nft.mintAddress,
      price: sol(1),
      printReceipt: false,
    })
    .run();

  // Then we still get a bid model.
  t.equal(bid.tradeStateAddress, buyerTradeState);
  t.same(bid.price, sol(1));
  t.same(bid.tokens, token(1));

  // But we cannot retrieve it later with the default operation handler.
  try {
    await client.findBidByAddress(buyerTradeState).run();
    t.fail('expected to throw AccountNotFoundError');
  } catch (error: any) {
    const hasNotFoundMessage = error.message.includes(
      'The account of type [BidReceipt] was not found'
    );
    t.ok(error instanceof AccountNotFoundError, 'throws AccountNotFoundError');
    t.ok(hasNotFoundMessage, 'has BidReceipt Not Found message');
  }
});

test('[auctionHouseModule] create a new bid on an Auction House with 0 SOL', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const { auctionHouse, client } = await createAuctionHouse(mx);

  // When we list that NFT for 6.5 SOL.
  await client
    .list({
      mintAccount: nft.mintAddress,
    })
    .run();

  const { bid, buyerTradeState } = await client
    .bid({
      mintAccount: nft.mintAddress,
    })
    .run();

  // Then we created and returned the new Bid with appropriate defaults.
  const expectedBid = {
    tradeStateAddress: spokSamePubkey(buyerTradeState),
    price: spokSameAmount(sol(0)),
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
  spok(t, bid, {
    $topic: 'Bid',
    ...expectedBid,
  } as unknown as Specifications<Bid>);

  // And we get the same result when we fetch the Auction House by address.
  const retrieveBid = await client.findBidByAddress(buyerTradeState).run();
  spok(t, retrieveBid, {
    $topic: 'Retrieved Bid',
    ...expectedBid,
  } as unknown as Specifications<Bid>);
});
