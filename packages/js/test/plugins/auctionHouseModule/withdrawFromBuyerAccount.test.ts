import test, { Test } from 'tape';
import { sol } from '@/types';
import { metaplex, killStuckProcess, assertThrows } from '../../helpers';
import { createAuctionHouse } from './helpers';
import { findAuctionHouseBuyerEscrowPda } from '@/plugins';
import { Keypair } from '@solana/web3.js';

killStuckProcess();

test('[auctionHouseModule] withdraw from buyer account on an Auction House', async (t: Test) => {
  // Given we have an Auction House.
  const mx = await metaplex();

  const { auctionHouse } = await createAuctionHouse(mx);

  // And deposit 1 SOL to the buyer's escrow account.
  await mx
    .auctionHouse()
    .depositToBuyerAccount({
      auctionHouse,
      amount: sol(1),
    })
    .run();

  // When we withdraw 1 SOL from the buyer's escrow account.
  await mx
    .auctionHouse()
    .withdrawFromBuyerAccount({
      auctionHouse,
      amount: sol(1),
    })
    .run();

  // Then buyer's escrow account has minimum rent exempt SOL
  const buyerEscrow = findAuctionHouseBuyerEscrowPda(
    auctionHouse.address,
    mx.identity().publicKey
  );
  const buyerEscrowBalance = await mx.rpc().getBalance(buyerEscrow);
  const minimumRentExempt = await mx.rpc().getRent(0);

  t.same(
    buyerEscrowBalance.basisPoints.toNumber(),
    minimumRentExempt.basisPoints.toNumber()
  );
});

test('[auctionHouseModule] it throws an error if Auctioneer Authority is not provided in Auctioneer Withdraw', async (t: Test) => {
  // Given we have an Auction House.
  const mx = await metaplex();
  const auctioneerAuthority = Keypair.generate();

  const { auctionHouse } = await createAuctionHouse(mx, auctioneerAuthority);

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
