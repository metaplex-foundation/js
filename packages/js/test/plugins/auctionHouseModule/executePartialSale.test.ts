import test, { Test } from 'tape';
import { sol, token } from '@/types';
import {
  metaplex,
  killStuckProcess,
  createSft,
  createWallet,
  assertThrows,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import { Keypair } from '@solana/web3.js';
import { findAssociatedTokenAccountPda } from '@/plugins';

killStuckProcess();

test('[auctionHouseModule] execute partial sale on an Auction House', async (t: Test) => {
  // Given we have an Auction House and a SFT with 5 supply.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const auctionHouse = await createAuctionHouse(mx);
  const sft = await createSft(mx);

  await mx
    .tokens()
    .mint({
      mintAddress: sft.address,
      amount: token(10),
    })
    .run();

  // And we listed that 5 SFTs for 1 SOL each.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: sft.address,
      price: sol(5),
      tokens: token(5),
    })
    .run();

  // And we created a public bid on that SFT to buy only 3 Tokens.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: sft.address,
      price: sol(3),
      tokens: token(3),
    })
    .run();

  // When we execute a sale with given listing and bid.
  const { purchase } = await mx
    .auctionHouse()
    .executeSale({
      auctionHouse,
      listing,
      bid,
    })
    .run();

  // Then the user must receive 3 Tokens.
  const buyerTokens = await mx
    .nfts()
    .findByToken({ token: purchase.asset.token.address })
    .run();

  t.equal(buyerTokens.token.amount.basisPoints.toNumber(), 3);

  // And then the seller must have 2 Tokens on sale left.
  const sellerTokens = await mx
    .nfts()
    .findByToken({ token: listing.asset.token.address })
    .run();

  t.equal(sellerTokens.token.delegateAmount.basisPoints.toNumber(), 2);
});

test('[auctionHouseModule] execute partial sale on an Auction House with SPL treasury', async (t: Test) => {
  // Given we have a Metaplex instance and SFT.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const sft = await createSft(mx);

  await mx
    .tokens()
    .mint({
      mintAddress: sft.address,
      amount: token(10),
    })
    .run();

  // And an existing SPL treasury.
  const { token: treasuryToken } = await mx
    .tokens()
    .createTokenWithMint()
    .run();

  // And airdrop 4 Payment SPL Tokens to buyer.
  await mx
    .tokens()
    .mint({
      mintAddress: treasuryToken.mint.address,
      amount: token(4),
      toOwner: buyer.publicKey,
    })
    .run();

  // And we created a new Auction House using that treasury.
  const treasuryMint = treasuryToken.mint.address;
  const auctionHouse = await createAuctionHouse(mx, null, {
    treasuryMint,
  });

  // And we listed that 5 SFTs for 2 Payment Tokens each.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: sft.address,
      price: token(10),
      tokens: token(5),
    })
    .run();

  // And we created a private bid on 2 SFTs for 4 Payment Tokens.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: sft.address,
      price: token(4),
      tokens: token(2),
    })
    .run();

  // When we execute a sale with given listing and bid.
  const { purchase } = await mx
    .auctionHouse()
    .executeSale({
      auctionHouse,
      listing,
      bid,
    })
    .run();

  // Then the user must receive 2 SFTs.
  const buyerTokens = await mx
    .nfts()
    .findByToken({ token: purchase.asset.token.address })
    .run();

  t.equal(buyerTokens.token.amount.basisPoints.toNumber(), 2);

  // And then the seller must have 3 SFTs on sale left.
  const sellerTokens = await mx
    .nfts()
    .findByToken({ token: listing.asset.token.address })
    .run();

  t.equal(sellerTokens.token.delegateAmount.basisPoints.toNumber(), 3);

  // And payment tokens left buyer's account.
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

test('[auctionHouseModule] it throws when executing partial sale with wrong price on an Auction House', async (t: Test) => {
  // Given we have a Metaplex instance and SFT with 10 Supply.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const sft = await createSft(mx);

  await mx
    .tokens()
    .mint({
      mintAddress: sft.address,
      amount: token(10),
    })
    .run();

  // And existing SPL treasury SFT.
  const paymentSft = await createSft(mx);

  // And airdrop 4 Payment SPL Tokens to buyer.
  await mx
    .tokens()
    .mint({
      mintAddress: paymentSft.mint.address,
      amount: token(4),
      toOwner: buyer.publicKey,
    })
    .run();

  // And we created a new Auction House using that treasury.
  const treasuryMint = paymentSft.mint.address;
  const auctionHouse = await createAuctionHouse(mx, null, {
    treasuryMint,
  });

  // And we listed that 5 SFTs for 2 Payment Tokens each.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: sft.address,
      price: token(10),
      tokens: token(5),
    })
    .run();

  // And we created a private bid on 2 SFTs for 2 Payment Tokens only.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: sft.address,
      price: token(2),
      tokens: token(2),
    })
    .run();

  // When we execute a sale with the price that is lower than required.
  const promise = mx
    .auctionHouse()
    .executeSale({
      auctionHouse,
      listing,
      bid,
    })
    .run();

  // Then we expect an error with expected and provided amounts.
  await assertThrows(
    t,
    promise,
    /Expected to receive Token 2 per SFT but provided Token 1 per SFT/
  );
});

test('[auctionHouseModule] it throws when executing partial sale with wrong price on an Auction House', async (t: Test) => {
  // Given we have an Auction House and a SFT with 5 supply.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const auctionHouse = await createAuctionHouse(mx);
  const sft = await createSft(mx);

  await mx
    .tokens()
    .mint({
      mintAddress: sft.address,
      amount: token(5),
    })
    .run();

  // And we listed that 5 SFTs for 1 SOL each.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: sft.address,
      price: sol(5),
      tokens: token(5),
    })
    .run();

  // And we created a public bid on that SFT to buy only 3 Tokens but for 1 SOL.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: sft.address,
      price: sol(1),
      tokens: token(3),
    })
    .run();

  // When we execute a sale with the price that is lower than required.
  const promise = mx
    .auctionHouse()
    .executeSale({
      auctionHouse,
      listing,
      bid,
    })
    .run();

  // Then we expect an error with expected and provided amounts.
  await assertThrows(
    t,
    promise,
    /Expected to receive SOL 1.000000000 per SFT but provided SOL 0.333333333 per SFT/
  );
});

test('[auctionHouseModule] it throws when executing partial sale when no supply left on an Auction House', async (t: Test) => {
  // Given we have an Auction House and a SFT with 5 supply.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const auctionHouse = await createAuctionHouse(mx);
  const sft = await createSft(mx);

  await mx
    .tokens()
    .mint({
      mintAddress: sft.address,
      amount: token(5),
    })
    .run();

  // And we listed that 5 SFTs for 1 SOL each.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      mintAccount: sft.address,
      price: sol(5),
      tokens: token(5),
    })
    .run();

  // And we bought only 3 Tokens but for 1 SOL.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: sft.address,
      price: sol(3),
      tokens: token(3),
    })
    .run();

  await mx
    .auctionHouse()
    .executeSale({
      auctionHouse,
      listing,
      bid,
    })
    .run();

  // When we execute a sale to buy more tokens than left.
  const { bid: exceedBid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      buyer,
      mintAccount: sft.address,
      price: sol(3),
      tokens: token(3),
    })
    .run();

  const promise = mx
    .auctionHouse()
    .executeSale({
      auctionHouse,
      listing,
      bid: exceedBid,
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /Amount of tokens available for purchase is less than the partial order amount/
  );
});

test('[auctionHouseModule] it throws when executing partial sale in Auctioneer', async (t: Test) => {
  // Given we have an Auction House and a SFT with 5 supply.
  const mx = await metaplex();
  const buyer = await createWallet(mx);
  const auctioneerAuthority = Keypair.generate();
  const auctionHouse = await createAuctionHouse(mx, auctioneerAuthority);
  const sft = await createSft(mx);

  await mx
    .tokens()
    .mint({
      mintAddress: sft.address,
      amount: token(5),
    })
    .run();

  // And we listed that 5 SFTs for 1 SOL each.
  const { listing } = await mx
    .auctionHouse()
    .list({
      auctionHouse,
      auctioneerAuthority,
      mintAccount: sft.address,
      price: sol(5),
      tokens: token(5),
    })
    .run();

  // When we execute a sale to buy more tokens than left.
  const { bid } = await mx
    .auctionHouse()
    .bid({
      auctionHouse,
      auctioneerAuthority,
      buyer,
      mintAccount: sft.address,
      price: sol(3),
      tokens: token(3),
    })
    .run();

  const promise = mx
    .auctionHouse()
    .executeSale({
      auctionHouse,
      auctioneerAuthority,
      listing,
      bid,
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /You are trying to execute a partial sale, but partial orders are not supported in Auctioneer/
  );
});
