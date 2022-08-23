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
  assertThrows,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import {
  AccountNotFoundError,
  findAssociatedTokenAccountPda,
  Pda,
  Purchase,
} from '@/index';
import { Keypair } from '@solana/web3.js';

killStuckProcess();

test('[auctionHouseModule] execute sale on an Auction House', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const { auctionHouse } = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // And we created a private bid on that NFT for 1 SOL.
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

  // When we execute a sale with given listing and bid.
  const { purchase } = await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing, bid })
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

  // And we get the same result when we fetch the Purchase by address.
  const retrievePurchase = await mx
    .auctionHouse()
    .findPurchaseByReceipt({
      receiptAddress: purchase.receiptAddress as Pda,
      auctionHouse,
    })
    .run();
  spok(t, retrievePurchase, {
    $topic: 'Retrieved Purchase',
    ...expectedPurchase,
  } as unknown as Specifications<Purchase>);
});

test('[auctionHouseModule] it executes sale on an Auction House with separate authority', async (t: Test) => {
  // Given we have an Auction House with separate authority and an NFT.
  const mx = await metaplex();
  const authority = await createWallet(mx);
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);

  const { auctionHouse } = await createAuctionHouse(mx, null, {
    authority,
  });

  // And we listed that NFT for 1 SOL.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // And we created a private bid on that NFT for 1 SOL.
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

  // When we execute a sale with given listing and bid.
  const { purchase } = await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing, bid })
    .run();

  // Then we created and returned the new Purchase
  t.equal(purchase.asset.address.toBase58(), nft.address.toBase58());
});

test('[auctionHouseModule] it executes receipt-less sale on an Auction House when Bid is receipt-less but cannot fetch it afterwards by default', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const { auctionHouse } = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // And we created a private receipt-less bid on that NFT for 1 SOL.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: nft.address,
      tokenAccount: nft.token.address,
      price: sol(1),
      printReceipt: false,
    })
    .run();

  // When we execute a sale with given listing and receipt-less bid.
  const { purchase } = await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing, bid })
    .run();

  // Then we still get a purchase model but without a generated receipt.
  t.same(purchase.asset.address, nft.address);
  t.false(purchase.receiptAddress);

  // But we cannot retrieve it later with the default operation handler.
  try {
    await mx
      .auctionHouse()
      .findPurchaseByTradeState({
        auctionHouse,
        sellerTradeState: listing.tradeStateAddress,
        buyerTradeState: bid.tradeStateAddress,
      })
      .run();
    t.fail('expected to throw AccountNotFoundError');
  } catch (error: any) {
    const hasNotFoundMessage = error.message.includes(
      'The account of type [PurchaseReceipt] was not found'
    );
    t.ok(error instanceof AccountNotFoundError, 'throws AccountNotFoundError');
    t.ok(hasNotFoundMessage, 'has PurchaseReceipt Not Found message');
  }
});

test('[auctionHouseModule] it executes receipt-less sale on an Auction House when Listing is receipt-less', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const { auctionHouse } = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL without receipt.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
      printReceipt: false,
    })
    .run();

  // And we created a private bid on that NFT for 1 SOL.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: nft.address,
      tokenAccount: nft.token.address,
      price: sol(1),
    })
    .run();

  // When we execute a sale with given bid and receipt-less listing.
  const { purchase } = await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing, bid })
    .run();

  // Then we still get a purchase model but without a generated receipt.
  t.same(purchase.asset.address, nft.address);
  t.false(purchase.receiptAddress);
});

test('[auctionHouseModule] it executes sale on an Auction House when Bid is public', async (t: Test) => {
  // Given we have an Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);
  const { auctionHouse } = await createAuctionHouse(mx);

  // And we listed that NFT for 1 SOL.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // And we created a public bid on that NFT for 1 SOL.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // When we execute a sale with given listing and bid.
  const { purchase } = await mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing, bid })
    .run();

  // Then we created and returned the new Purchase
  t.equal(purchase.asset.address.toBase58(), nft.address.toBase58());
});

test('[auctionHouseModule] it executes sale on an Auction House with Auctioneer', async (t: Test) => {
  // Given we have an Auctioneer Auction House and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);

  const auctioneerAuthority = Keypair.generate();
  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority);

  // And we listed that NFT.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      auctioneerAuthority,
      mintAccount: nft.address,
    })
    .run();

  // And we created a public bid on that NFT for 1 SOL.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      auctioneerAuthority,
      buyer,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // When we execute an auctioneer sale with given listing and bid.
  const { purchase } = await mx
    .auctionHouse()
    .executeSale({
      auctionHouse,
      auctioneerAuthority,
      listing,
      bid,
    })
    .run();

  // Then we created and returned the new Purchase
  t.equal(purchase.asset.address.toBase58(), nft.address.toBase58());
});

test('[auctionHouseModule] it throws an error if Bid and Listing have different Auction House', async (t: Test) => {
  // Given we have two Auction Houses and an NFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  const nft = await createNft(mx);

  const { auctionHouse } = await createAuctionHouse(mx);
  const { auctionHouse: buyerAuctionHouse } = await createAuctionHouse(
    mx,
    null,
    {
      authority: buyer,
    }
  );

  // And we listed that NFT for 1 SOL.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // And we created a public bid on that NFT for 1 SOL but with different AH.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse: buyerAuctionHouse,
      mintAccount: nft.address,
      price: sol(1),
    })
    .run();

  // When we execute a sale with given listing and bid.
  const promise = mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing, bid })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /You are trying to use a Bid and a Listing from different Auction Houses./
  );
});

test('[auctionHouseModule] it throws an error if Bid and Listing have different Token', async (t: Test) => {
  // Given we have an Auction House and two NFTs.
  const mx = await metaplex();

  const firstNft = await createNft(mx);
  const secondNft = await createNft(mx);
  const { auctionHouse } = await createAuctionHouse(mx);

  // And we listed that First NFT for 1 SOL.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: firstNft.address,
      price: sol(1),
    })
    .run();

  // And we created a public bid on that Second NFT.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      mintAccount: secondNft.address,
      price: sol(1),
    })
    .run();

  // When we execute a sale with given listing and bid.
  const promise = mx
    .auctionHouse()
    .executeSale({ auctionHouse, listing, bid })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /You are trying to execute a sale using a Bid and a Listing that have different mint addresses./
  );
});

test('[auctionHouseModule] it executes sale on an Auction House with SPL treasury', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();
  const buyer = await createWallet(mx);

  // And an existing SPL treasury.
  const { token: treasuryToken } = await mx
    .tokens()
    .createTokenWithMint()
    .run();

  // And airdrop 2 Tokens to buyer.
  await mx
    .tokens()
    .mint({
      mintAddress: treasuryToken.mint.address,
      amount: token(2),
      toOwner: buyer.publicKey,
    })
    .run();

  // And we created a new Auction House using that treasury with NFT to sell.
  const treasuryMint = treasuryToken.mint.address;
  const { auctionHouse } = await createAuctionHouse(mx, null, {
    treasuryMint,
  });
  const nft = await createNft(mx);

  // And we listed that NFT for 2 Tokens.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: nft.address,
      price: token(2),
    })
    .run();

  // And we created a private bid on that NFT for 2 Tokens.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: nft.address,
      tokenAccount: nft.token.address,
      price: token(2),
    })
    .run();

  // When we execute a sale with given listing and bid.
  const { purchase } = await mx
    .auctionHouse()
    .executeSale({
      auctionHouse,
      listing,
      bid,
      confirmOptions: { skipPreflight: true },
    })
    .run();

  // Then we created and returned the new Purchase
  t.equal(purchase.asset.address.toBase58(), nft.address.toBase58());

  // And treasury tokens left buyer's account.
  const paymentAccount = findAssociatedTokenAccountPda(
    auctionHouse.treasuryMint.address,
    buyer.publicKey
  );

  const buyerToken = await mx
    .tokens()
    .findTokenByAddress({ address: paymentAccount })
    .run();

  t.equal(buyerToken.amount.basisPoints.toNumber(), 0);
});
