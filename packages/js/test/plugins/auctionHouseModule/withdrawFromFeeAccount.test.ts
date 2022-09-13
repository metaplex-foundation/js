import test, { Test } from 'tape';
import { sol, toPublicKey } from '@/types';
import { metaplex, killStuckProcess, createWallet } from '../../helpers';

killStuckProcess();

test('[auctionHouseModule] withdraw from fee account on an Auction House', async (t: Test) => {
  // Given we have an Auction House and airdropped 100 SOL to fee account.
  const mx = await metaplex();
  const payer = await createWallet(mx);

  const { auctionHouse } = await mx
    .auctionHouse()
    .create({
      sellerFeeBasisPoints: 200,
      payer,
      confirmOptions: { skipPreflight: true },
    })
    .run();

  // And withdrawal destination has 100 SOL.
  const originalFeeWithdrawalDestinationBalance = await mx
    .rpc()
    .getBalance(toPublicKey(auctionHouse.feeWithdrawalDestinationAddress));

  t.same(
    originalFeeWithdrawalDestinationBalance.basisPoints.toNumber(),
    sol(100).basisPoints.toNumber()
  );

  await mx.rpc().airdrop(auctionHouse.feeAccountAddress, sol(100));

  // When we withdraw 1 SOL from fee account.
  await mx
    .auctionHouse()
    .withdrawFromFeeAccount({
      auctionHouse,
      payer,
      amount: sol(1),
    })
    .run();

  // Then fee account has 99 SOL in it.
  const feeAccountBalance = await mx
    .rpc()
    .getBalance(auctionHouse.feeAccountAddress);

  t.same(
    feeAccountBalance.basisPoints.toNumber(),
    sol(99).basisPoints.toNumber()
  );

  // And withdrawal destination account got 1 SOL more after withdrawal.
  const feeWithdrawalDestinationBalance = await mx
    .rpc()
    .getBalance(toPublicKey(auctionHouse.feeWithdrawalDestinationAddress));

  t.same(
    feeWithdrawalDestinationBalance.basisPoints.toNumber(),
    sol(101).basisPoints.toNumber()
  );
});

test('[auctionHouseModule] withdraw from fee account to a different wallet on an Auction House', async (t: Test) => {
  // Given we have an Auction House and airdropped 100 SOL to fee destination account.
  const mx = await metaplex();
  const feeWithdrawalDestination = await createWallet(mx);

  const { auctionHouse } = await mx
    .auctionHouse()
    .create({
      sellerFeeBasisPoints: 200,
      feeWithdrawalDestination: toPublicKey(feeWithdrawalDestination),
    })
    .run();

  await mx.rpc().airdrop(auctionHouse.feeAccountAddress, sol(100));

  // When we withdraw 1 SOL from fee account.
  await mx
    .auctionHouse()
    .withdrawFromFeeAccount({
      auctionHouse,
      amount: sol(1),
    })
    .run();

  // Then withdrawal destination account has 101 SOL in it.
  const feeWithdrawalDestinationBalance = await mx
    .rpc()
    .getBalance(toPublicKey(feeWithdrawalDestination));

  t.same(
    feeWithdrawalDestinationBalance.basisPoints.toNumber(),
    sol(101).basisPoints.toNumber()
  );
});
