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
import { findAssociatedTokenAccountPda } from '@/plugins';
import { Bid } from '@/plugins/auctionHouseModule/Bid';
import { AuthorityScope } from '@metaplex-foundation/mpl-auction-house';

killStuckProcess();

test('[auctionHouseModule] create a new public bid on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, {}, { owner: seller.publicKey });

  const { auctionHouse, client } = await createAuctionHouse(mx);

  // When we create a public bid on that NFT for 6.5 SOL.
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
    isPublic: true,
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
  const seller = await createWallet(mx);
  const nft = await createNft(mx, {}, { owner: seller.publicKey });

  const { auctionHouse, client } = await createAuctionHouse(mx);

  const tokenAddress = findAssociatedTokenAccountPda(
    nft.mintAddress,
    seller.publicKey
  );

  // When we create a private bid on that NFT for 1 SOL.
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
      address: findAssociatedTokenAccountPda(nft.mintAddress, seller.publicKey),
      mint: {
        address: spokSamePubkey(nft.mintAddress),
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
  const nft = await createNft(mx, {}, { owner: seller.publicKey });

  const { auctionHouse, client } = await createAuctionHouse(mx);

  // When we create a private bid on that NFT for 1 SOL.
  const { bid, buyerTradeState } = await client
    .bid({
      mintAccount: nft.mintAddress,
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
    mint: spok.notDefined,
    token: {
      address: findAssociatedTokenAccountPda(nft.mintAddress, seller.publicKey),
      mint: {
        address: spokSamePubkey(nft.mintAddress),
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
  const nft = await createNft(mx, {}, { owner: seller.publicKey });

  const { client } = await createAuctionHouse(mx);

  // When we create a private bid on that NFT for 1 SOL.
  const { bid, buyerTradeState } = await client
    .bid({
      mintAccount: nft.mintAddress,
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

  // But we cannot retrieve it later with the default operation handler.
  const promise = client.findBidByAddress(buyerTradeState).run();
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
  const nft = await createNft(mx, {}, { owner: seller.publicKey });

  const { client } = await createAuctionHouse(mx);

  // When we create a public bid on that NFT for 1 SOL.
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
  t.ok(bid.isPublic);

  // But we cannot retrieve it later with the default operation handler.
  const promise = client.findBidByAddress(buyerTradeState).run();
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
  const nft = await createNft(mx, {}, { owner: seller.publicKey });

  const auctioneerAuthority = Keypair.generate();

  const { client } = await createAuctionHouse(mx, auctioneerAuthority);

  // When we create a private bid on that NFT for 1 SOL.
  const { bid, buyerTradeState } = await client
    .bid({
      mintAccount: nft.mintAddress,
      seller: seller.publicKey,
      price: sol(1),
    })
    .run();

  // Then we created and returned the new Bid with appropriate defaults.
  t.equal(bid.tradeStateAddress, buyerTradeState);
  t.same(bid.price, sol(1));
  t.same(bid.tokens, token(1));
  t.false(bid.isPublic);
});

test('[auctionHouseModule] create public receipt-less Auctioneer bid', async (t: Test) => {
  // Given we have an Auctioneer Auction House and an NFT.
  const mx = await metaplex();
  const seller = await createWallet(mx);
  const nft = await createNft(mx, {}, { owner: seller.publicKey });

  const auctioneerAuthority = Keypair.generate();

  const { client } = await createAuctionHouse(mx, auctioneerAuthority);

  // When we create a public bid on that NFT for 1 SOL.
  const { bid, buyerTradeState } = await client
    .bid({
      mintAccount: nft.mintAddress,
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
  const nft = await createNft(mx, {}, { owner: seller.publicKey });

  const auctioneerAuthority = Keypair.generate();

  // Create Auctioneer Auction House to only allow Sell.
  const { client } = await createAuctionHouse(mx, auctioneerAuthority, {
    auctioneerScopes: [AuthorityScope.Sell],
  });

  // When we create a private bid on that NFT for 1 SOL.
  const promise = client
    .bid({
      mintAccount: nft.mintAddress,
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
  const nft = await createNft(mx, {}, { owner: seller.publicKey });

  const auctioneerAuthority = Keypair.generate();

  // And an Auctioneer Auction House that, at first, could only Sell.
  const { auctionHouse, client } = await createAuctionHouse(
    mx,
    auctioneerAuthority,
    { auctioneerScopes: [AuthorityScope.Sell] }
  );

  // But was later on updated to also allow the Buy scope.
  await mx
    .auctions()
    .updateAuctionHouse(auctionHouse, {
      auctioneerAuthority: auctioneerAuthority.publicKey,
      auctioneerScopes: [AuthorityScope.Sell, AuthorityScope.Buy],
    })
    .run();

  // When we create a private bid on that NFT for 1 SOL.
  const { bid, buyerTradeState } = await client
    .bid({
      mintAccount: nft.mintAddress,
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
  const nft = await createNft(mx, {}, { owner: seller.publicKey });

  // And an Auctioneer Auction House.
  const auctioneerAuthority = Keypair.generate();
  const { auctionHouse } = await mx
    .auctions()
    .createAuctionHouse({
      sellerFeeBasisPoints: 200,
      auctioneerAuthority: auctioneerAuthority.publicKey,
    })
    .run();

  // When we create a client for that Auction House without providing the auctioneerAuthority.
  const client = mx.auctions().for(auctionHouse);

  // And we create a private bid on that NFT for 1 SOL.
  const promise = client
    .bid({
      mintAccount: nft.mintAddress,
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
