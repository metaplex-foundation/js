import test, { Test } from 'tape';
import { sol } from '@/types';
import { metaplex, killStuckProcess, assertThrows } from '../../helpers';
import { createAuctionHouse } from './helpers';
import { findAuctionHouseBuyerEscrowPda } from '@/plugins';
import { Keypair } from '@solana/web3.js';

killStuckProcess();

test('[auctionHouseModule] deposit to buyer account on an Auction House', async (t: Test) => {
  // Given we have an Auction House.
  const mx = await metaplex();

  const { auctionHouse } = await createAuctionHouse(mx);

  // And we deposit 1 SOL.
  await mx
    .auctionHouse()
    .depositToBuyerAccount({
      auctionHouse,
      amount: sol(1),
    })
    .run();

  // Then buyer's escrow account has SOL in it.
  const buyerEscrow = findAuctionHouseBuyerEscrowPda(
    auctionHouse.address,
    mx.identity().publicKey
  );
  const buyerEscrowBalance = await mx.rpc().getBalance(buyerEscrow);

  t.not(buyerEscrowBalance.basisPoints.toNumber(), 0);
});

test('[auctionHouseModule] deposit to buyer account on an Auctioneer Auction House', async (t: Test) => {
  // Given we have an Auctioneer Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();

  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority);

  // And we deposit 1 SOL.
  await mx
    .auctionHouse()
    .depositToBuyerAccount({
      auctionHouse,
      auctioneerAuthority,
      amount: sol(1),
    })
    .run();

  // Then buyer's escrow account has SOL in it.
  const buyerEscrow = findAuctionHouseBuyerEscrowPda(
    auctionHouse.address,
    mx.identity().publicKey
  );
  const buyerEscrowBalance = await mx.rpc().getBalance(buyerEscrow);

  t.not(buyerEscrowBalance.basisPoints.toNumber(), 0);
});

test('[auctionHouseModule] it throws an error if Auctioneer Authority is not provided in Auctioneer Deposit', async (t: Test) => {
  // Given we have an Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();

  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority);

  // When we deposit without providing auctioneer authority.
  const promise = mx
    .auctionHouse()
    .depositToBuyerAccount({
      auctionHouse,
      amount: sol(1),
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /you have not provided the required "auctioneerAuthority" parameter/
  );
});
