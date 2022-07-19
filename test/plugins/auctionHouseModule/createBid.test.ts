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

test('[auctionHouseModule] create a new public bid on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const { auctionHouse, client } = await createAuctionHouse(mx);

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
    mint: {
      address: spokSamePubkey(nft.mintAddress),
    },
    token: spok.notDefined,
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

test('[auctionHouseModule] create a new private bid by token account on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const { auctionHouse, client } = await createAuctionHouse(mx);

  const tokenAddress = findAssociatedTokenAccountPda(
    nft.mintAddress,
    mx.identity().publicKey
  );

  const { bid, buyerTradeState } = await client
    .bid({
      mintAccount: nft.mintAddress,
      tokenAccount: tokenAddress,
      price: sol(1),
    })
    .run();

  // Then we created and returned the new Bid with appropriate defaults.
  const expectedBid = {
    tradeStateAddress: spokSamePubkey(buyerTradeState),
    price: spokSameAmount(sol(1)),
    tokens: spokSameAmount(token(1)),
    auctionHouse: {
      address: spokSamePubkey(auctionHouse.address),
    },
    mint: spok.notDefined,
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


test('[auctionHouseModule] create a new private bid by seller account on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const { auctionHouse, client } = await createAuctionHouse(mx);

  const { bid, buyerTradeState } = await client
    .bid({
      mintAccount: nft.mintAddress,
      seller: mx.identity().publicKey,
      price: sol(1),
    })
    .run();

  // Then we created and returned the new Bid with appropriate defaults.
  const expectedBid = {
    tradeStateAddress: spokSamePubkey(buyerTradeState),
    price: spokSameAmount(sol(1)),
    tokens: spokSameAmount(token(1)),
    auctionHouse: {
      address: spokSamePubkey(auctionHouse.address),
    },
    mint: spok.notDefined,
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

test('[auctionHouseModule] create public receipt-less bid but can fetch it afterwards by default', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const { client } = await createAuctionHouse(mx);

  const { bid, buyerTradeState } = await client
    .bid({
      mintAccount: nft.mintAddress,
      seller: mx.identity().publicKey,
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

test('[auctionHouseModule] create private receipt-less bid but can fetch it afterwards by default', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const { client } = await createAuctionHouse(mx);

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
