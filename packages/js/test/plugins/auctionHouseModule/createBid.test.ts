import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { sol, token } from '@/types';
import {
  assertThrows,
  metaplex,
  killStuckProcess,
  createNft,
  spokSamePubkey,
  spokSameAmount,
  createWallet,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import { Bid, findAssociatedTokenAccountPda, Pda } from '@/index';
import { AuthorityScope } from '@metaplex-foundation/mpl-auction-house';

killStuckProcess();

test('[auctionHouseModule] create a new public bid on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, { tokenOwner: seller.publicKey });

  const { auctionHouse } = await createAuctionHouse(mx);

  // When we create a public bid on that NFT for 6.5 SOL.
  const { bid, buyerTradeState } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: nft.address,
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
    asset: {
      model: 'nft',
      address: spokSamePubkey(nft.address),
      token: spok.notDefined,
    },
    receiptAddress: spok.defined,
    isPublic: true,
  };
  spok(t, bid, {
    $topic: 'Bid',
    ...expectedBid,
  } as unknown as Specifications<Bid>);

  // And we get the same result when we fetch the Bid by address.
  const retrieveBid = await mx
    .auctionHouse()
    .findBidByReceipt({
      auctionHouse,
      receiptAddress: bid.receiptAddress as Pda,
    })
    .run();
  spok(t, retrieveBid, {
    $topic: 'Retrieved Bid',
    ...expectedBid,
  } as unknown as Specifications<Bid>);
});

test('[auctionHouseModule] create a new private bid by token account on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, { tokenOwner: seller.publicKey });

  const { auctionHouse } = await createAuctionHouse(mx);

  const tokenAddress = findAssociatedTokenAccountPda(
    nft.address,
    seller.publicKey
  );

  // When we create a private bid on that NFT for 1 SOL.
  const { bid, buyerTradeState } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: nft.address,
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
    asset: {
      model: 'nft',
      address: spokSamePubkey(nft.address),
      token: {
        address: findAssociatedTokenAccountPda(nft.address, seller.publicKey),
      },
    },
    isPublic: false,
  };
  spok(t, bid, {
    $topic: 'Bid',
    ...expectedBid,
  } as unknown as Specifications<Bid>);
});

test('[auctionHouseModule] create a new private bid by seller account on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, { tokenOwner: seller.publicKey });

  const { auctionHouse } = await createAuctionHouse(mx);

  // When we create a private bid on that NFT for 1 SOL.
  const { bid, buyerTradeState } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: nft.address,
      seller: seller.publicKey,
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
    asset: {
      model: 'nft',
      address: spokSamePubkey(nft.address),
      token: {
        address: findAssociatedTokenAccountPda(nft.address, seller.publicKey),
      },
    },
    isPublic: false,
  };
  spok(t, bid, {
    $topic: 'Bid',
    ...expectedBid,
  } as unknown as Specifications<Bid>);
});

test('[auctionHouseModule] create private receipt-less bid but cannot fetch it afterwards by default', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, { tokenOwner: seller.publicKey });

  const { auctionHouse } = await createAuctionHouse(mx);

  // When we create a private bid on that NFT for 1 SOL.
  const { bid, buyerTradeState } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: nft.address,
      seller: seller.publicKey,
      price: sol(1),
      printReceipt: false,
    })
    .run();

  // Then we still get a bid model.
  t.equal(bid.tradeStateAddress, buyerTradeState);
  t.same(bid.price, sol(1));
  t.same(bid.tokens, token(1));
  t.false(bid.isPublic);
  t.false(bid.receiptAddress);

  // But we cannot retrieve it later with the default operation handler.
  const promise = mx
    .auctionHouse()
    .findBidByTradeState({
      tradeStateAddress: bid.tradeStateAddress,
      auctionHouse,
    })
    .run();
  await assertThrows(
    t,
    promise,
    /The account of type \[BidReceipt\] was not found/
  );
});

test('[auctionHouseModule] create public receipt-less bid but cannot fetch it afterwards by default', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, { tokenOwner: seller.publicKey });

  const { auctionHouse } = await createAuctionHouse(mx);

  // When we create a public bid on that NFT for 1 SOL.
  const { bid, buyerTradeState } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
      printReceipt: false,
    })
    .run();

  // Then we still get a bid model.
  t.equal(bid.tradeStateAddress, buyerTradeState);
  t.same(bid.price, sol(1));
  t.same(bid.tokens, token(1));
  t.ok(bid.isPublic);

  // But we cannot retrieve it later with the default operation handler.
  const promise = mx
    .auctionHouse()
    .findBidByTradeState({
      tradeStateAddress: bid.tradeStateAddress,
      auctionHouse,
    })
    .run();
  await assertThrows(
    t,
    promise,
    /The account of type \[BidReceipt\] was not found/
  );
});

test('[auctionHouseModule] create private receipt-less Auctioneer bid', async (t: Test) => {
  // Given we have an Auctioneer Auction House and an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, { tokenOwner: seller.publicKey });

  const auctioneerAuthority = Keypair.generate();

  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority);

  // When we create a private bid on that NFT for 1 SOL.
  const { bid, buyerTradeState } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      auctioneerAuthority,
      mintAccount: nft.address,
      seller: seller.publicKey,
      price: sol(1),
    })
    .run();

  // Then we created and returned the new Bid with appropriate defaults.
  t.equal(bid.tradeStateAddress, buyerTradeState);
  t.same(bid.price, sol(1));
  t.same(bid.tokens, token(1));
  t.false(bid.isPublic);
  t.false(bid.receiptAddress);
});

test('[auctionHouseModule] create public receipt-less Auctioneer bid', async (t: Test) => {
  // Given we have an Auctioneer Auction House and an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, { tokenOwner: seller.publicKey });

  const auctioneerAuthority = Keypair.generate();

  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority);

  // When we create a public bid on that NFT for 1 SOL.
  const { bid, buyerTradeState } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      auctioneerAuthority,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // Then we created and returned the new Bid with appropriate defaults.
  t.equal(bid.tradeStateAddress, buyerTradeState);
  t.same(bid.price, sol(1));
  t.same(bid.tokens, token(1));
  t.ok(bid.isPublic);
});

test('[auctionHouseModule] it throws an error if Buy is not included in Auctioneer scopes', async (t: Test) => {
  // Given we have an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, { tokenOwner: seller.publicKey });

  const auctioneerAuthority = Keypair.generate();

  // Create Auctioneer Auction House to only allow Sell.
  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority, {
    auctioneerScopes: [AuthorityScope.Sell],
  });

  // When we create a private bid on that NFT for 1 SOL.
  const promise = mx
    .auctionHouse()
    .bid({
      auctionHouse,
      auctioneerAuthority,
      mintAccount: nft.address,
      seller: seller.publicKey,
      price: sol(1),
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /The Auctioneer does not have the correct scope for this action/
  );
});

test('[auctionHouseModule] it allows to Buy after Auctioneer scope update', async (t: Test) => {
  // Given we have an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, { tokenOwner: seller.publicKey });

  const auctioneerAuthority = Keypair.generate();

  // And an Auctioneer Auction House that, at first, could only Sell.
  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority, {
    auctioneerScopes: [AuthorityScope.Sell],
  });

  // But was later on updated to also allow the Buy scope.
  await mx
    .auctionHouse()
    .update({
      auctionHouse,
      auctioneerAuthority: auctioneerAuthority.publicKey,
      auctioneerScopes: [AuthorityScope.Sell, AuthorityScope.Buy],
    })
    .run();

  // When we create a private bid on that NFT for 1 SOL.
  const { bid, buyerTradeState } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      auctioneerAuthority,
      mintAccount: nft.address,
      seller: seller.publicKey,
      price: sol(1),
    })
    .run();

  // Then we still get a listing model.
  t.equal(bid.tradeStateAddress, buyerTradeState);
});

test('[auctionHouseModule] it throws an error if Auctioneer Authority is not provided in Auctioneer Bid', async (t: Test) => {
  // Given we have an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, { tokenOwner: seller.publicKey });

  // And an Auctioneer Auction House.
  const auctioneerAuthority = Keypair.generate();
  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority);

  // And we create a private bid on that NFT for 1 SOL without providing auctioneerAuthority.
  const promise = mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: nft.address,
      seller: seller.publicKey,
      price: sol(1),
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /you have not provided the required "auctioneerAuthority" parameter/
  );
});
