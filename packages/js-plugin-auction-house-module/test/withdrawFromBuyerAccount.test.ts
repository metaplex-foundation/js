import test, { Test } from 'tape';
import { addAmounts, sol } from '@/types';
import {
  metaplex,
  killStuckProcess,
  assertThrows,
  createWallet,
} from '../../helpers';
import { createAuctionHouse } from './helpers';
import { findAuctionHouseBuyerEscrowPda } from '@/plugins';
import { Keypair } from '@solana/web3.js';

killStuckProcess();

test('[auctionHouseModule] withdraw from buyer account on an Auction House', async (t: Test) => {
  // Given we have an Auction House.
  const mx = await metaplex();
  const auctionHouse = await createAuctionHouse(mx);

  // And deposit 1 SOL to the buyer's escrow account.
  await mx
    .auctionHouse()
    .depositToBuyerAccount({
      auctionHouse,
      amount: sol(1),
    })
    .run();

  // Then buyer's escrow account has SOL in it
  let buyerEscrow = findAuctionHouseBuyerEscrowPda(
    auctionHouse.address,
    mx.identity().publicKey
  );

  let buyerEscrowBalance = await mx.rpc().getBalance(buyerEscrow);
  const minimumRentExempt = await mx.rpc().getRent(0);

  t.same(
    buyerEscrowBalance.basisPoints.toNumber(),
    addAmounts(sol(1), minimumRentExempt).basisPoints.toNumber()
  );

  // When we withdraw 1 SOL from the buyer's escrow account.
  await mx
    .auctionHouse()
    .withdrawFromBuyerAccount({
      auctionHouse,
      amount: sol(1),
    })
    .run();

  // Then buyer's escrow account has minimum rent exempt SOL
  buyerEscrowBalance = await mx.rpc().getBalance(buyerEscrow);

  t.same(
    buyerEscrowBalance.basisPoints.toNumber(),
    minimumRentExempt.basisPoints.toNumber()
  );
});

test('[auctionHouseModule] withdraw from buyer account on an Auction House with assigned authority', async (t: Test) => {
  // Given we have an Auction House.
  const mx = await metaplex();
  const authority = await createWallet(mx);
  const auctionHouse = await createAuctionHouse(mx, null, { authority });

  // And deposit 1 SOL to the buyer's escrow account.
  await mx
    .auctionHouse()
    .depositToBuyerAccount({
      auctionHouse,
      amount: sol(1),
    })
    .run();

  // Then buyer's escrow account has SOL in it
  let buyerEscrow = findAuctionHouseBuyerEscrowPda(
    auctionHouse.address,
    mx.identity().publicKey
  );

  let buyerEscrowBalance = await mx.rpc().getBalance(buyerEscrow);
  const minimumRentExempt = await mx.rpc().getRent(0);

  t.same(
    buyerEscrowBalance.basisPoints.toNumber(),
    addAmounts(sol(1), minimumRentExempt).basisPoints.toNumber()
  );

  // When we withdraw 1 SOL from the buyer's escrow account.
  await mx
    .auctionHouse()
    .withdrawFromBuyerAccount({
      auctionHouse,
      amount: sol(1),
      authority,
    })
    .run();

  // Then buyer's escrow account has minimum rent exempt SOL
  buyerEscrowBalance = await mx.rpc().getBalance(buyerEscrow);

  t.same(
    buyerEscrowBalance.basisPoints.toNumber(),
    minimumRentExempt.basisPoints.toNumber()
  );
});

test('[auctionHouseModule] withdraw from buyer account on an Auctioneer Auction House', async (t: Test) => {
  // Given we have an Auctioneer Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();
  const auctionHouse = await createAuctionHouse(mx, auctioneerAuthority);

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
  let buyerEscrowBalance = await mx
    .auctionHouse()
    .getBuyerBalance({
      auctionHouse: auctionHouse.address,
      buyerAddress: mx.identity().publicKey,
    })
    .run();
  const minimumRentExempt = await mx.rpc().getRent(0);

  t.same(
    buyerEscrowBalance.basisPoints.toNumber(),
    addAmounts(sol(1), minimumRentExempt).basisPoints.toNumber()
  );

  // When we withdraw 1 SOL from the buyer's escrow account.
  await mx
    .auctionHouse()
    .withdrawFromBuyerAccount({
      auctionHouse,
      auctioneerAuthority,
      amount: sol(1),
    })
    .run();

  // Then buyer's escrow account has minimum rent exempt SOL
  buyerEscrowBalance = buyerEscrowBalance = await mx
    .auctionHouse()
    .getBuyerBalance({
      auctionHouse: auctionHouse.address,
      buyerAddress: mx.identity().publicKey,
    })
    .run();

  t.same(
    buyerEscrowBalance.basisPoints.toNumber(),
    minimumRentExempt.basisPoints.toNumber()
  );
});

test('[auctionHouseModule] it throws an error if Auctioneer Authority is not provided in Auctioneer Withdraw', async (t: Test) => {
  // Given we have an Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();
  const auctionHouse = await createAuctionHouse(mx, auctioneerAuthority);

  // When we don't provide auctioneer authority to withdrawFromBuyerAccount.
  const promise = mx
    .auctionHouse()
    .withdrawFromBuyerAccount({
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
