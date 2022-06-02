import test, { Test } from 'tape';
import { metaplex, killStuckProcess } from '../../helpers';
import { addAmounts, lamports, multiplyAmount } from '@/types';

killStuckProcess();

test('[utilsModule] it can estimate transaction fees', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we estimate the transaction fees.
  const feesFor1Tx = mx.utils().estimateTransactionFee(1);
  const feesFor2Tx = mx.utils().estimateTransactionFee(2);

  // Then we get the current transaction fee for each transaction provided.
  t.same(feesFor1Tx, lamports(5000));
  t.same(feesFor2Tx, lamports(10000));
});

test('[utilsModule] it can estimate rent-exemption fees', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we estimate the rent of 1Kb for one account.
  const rent = mx.utils().estimateRent(1024, 1);

  // Then we get same amount provided by the RPC.
  const rentFromRpc = mx.rpc().getRent(1024);
  t.same(rent, rentFromRpc);
});

test('[utilsModule] it can estimate rent-exemption fees for multiple accounts', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we estimate the rent of 1Kb for two accounts.
  const rent = await mx.utils().estimateRent(1024, 2);

  // Then we get same amount provided by the RPC for two accounts of 512 bytes.
  const rpcRentFor512Bytes = await mx.rpc().getRent(512);
  t.same(rent, multiplyAmount(rpcRentFor512Bytes, 2));

  // Which is not the same as one account of 1Kb.
  const rpcRentFor1024Bytes = await mx.rpc().getRent(1024);
  t.notSame(rent, rpcRentFor1024Bytes);
});

test('[utilsModule] it can estimate transaction and storage fees in one method', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we estimate the total price of storing 1Kb
  // across two accounts and using 3 transactions.
  const price = await mx.utils().estimate(1024, 2, 3);

  // Then we get the right amount.
  const rent = multiplyAmount(await mx.rpc().getRent(512), 2);
  const txFee = lamports(5000 * 3);
  t.same(price, addAmounts(rent, txFee));
});
