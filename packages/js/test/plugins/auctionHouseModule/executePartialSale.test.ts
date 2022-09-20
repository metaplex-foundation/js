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
  const buyerToken = await mx
    .nfts()
    .findByToken({ token: purchase.asset.token.address })
    .run();

  t.equal(buyerToken.token.amount.basisPoints.toNumber(), 3);
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
    /Expected to receive SOL 1.000000000 per token but provided SOL 0.333333333 per token/
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
