import test, { Test } from 'tape';
import { sol, toPublicKey } from '@/types';
import { metaplex, killStuckProcess, createWallet } from '../../helpers';
import { createAuctionHouse } from './helpers';

killStuckProcess();

test('[auctionHouseModule] withdraw from treasury account on an Auction House', async (t: Test) => {
  // Given we have an Auction House with fee that equals 10% and an NFT.
  const mx = await metaplex();
  const payer = await createWallet(mx);
  const auctionHouse = await createAuctionHouse(mx, null, {
    sellerFeeBasisPoints: 1000,
    payer,
  });

  // And withdrawal destination has 100 SOL.
  const originalTreasuryWithdrawalDestinationBalance = await mx
    .rpc()
    .getBalance(toPublicKey(auctionHouse.treasuryWithdrawalDestinationAddress));

  t.same(
    originalTreasuryWithdrawalDestinationBalance.basisPoints.toNumber(),
    sol(100).basisPoints.toNumber()
  );

  // And we airdropped 2 SOL to the treasury account.
  await mx.rpc().airdrop(auctionHouse.treasuryAccountAddress, sol(2));

  // When we withdraw 1 SOL from treasury account.
  await mx
    .auctionHouse()
    .withdrawFromTreasuryAccount({
      auctionHouse,
      payer,
      amount: sol(1),
    })
    .run();

  // Then treasury account has 1 SOL in it.
  const treasuryBalance = await mx
    .rpc()
    .getBalance(auctionHouse.treasuryAccountAddress);

  t.same(treasuryBalance.basisPoints.toNumber(), sol(1).basisPoints.toNumber());

  // And withdrawal destination account has 101 SOL after withdrawal.
  const treasuryWithdrawalDestinationBalance = await mx
    .rpc()
    .getBalance(toPublicKey(auctionHouse.treasuryWithdrawalDestinationAddress));

  t.same(
    treasuryWithdrawalDestinationBalance.basisPoints.toNumber(),
    sol(101).basisPoints.toNumber()
  );
});
