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

  // Deposit 1 SOL.
  await mx
    .auctionHouse()
    .depositToBuyerAccount({
      auctionHouse,
      amount: sol(1),
    })
    .run();

  // And withdraw 1 SOL.
  await mx
    .auctionHouse()
    .withdraw({
      auctionHouse,
      withdrawAmount: sol(1),
    })
    .run();

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

  // When  without providing auctioneer authority.
  const promise = mx
    .auctionHouse()
    .withdraw({
      auctionHouse,
      withdrawAmount: sol(1),
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /you have not provided the required "auctioneerAuthority" parameter/
  );
});
