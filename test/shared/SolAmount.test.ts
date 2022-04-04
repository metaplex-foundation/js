import BigNumber from 'bignumber.js';
import test, { Test } from 'tape';
import { SolAmount } from '@/index';

test('it can create a SolAmount from lamports', (t: Test) => {
  t.equal(SolAmount.fromLamports(0).getLamports().toNumber(), 0);
  t.equal(SolAmount.fromLamports(1).getLamports().toNumber(), 1);
  t.equal(SolAmount.fromLamports(42).getLamports().toNumber(), 42);
  t.end();
});

test('it can create a SolAmount from SOLs', (t: Test) => {
  t.equal(SolAmount.fromSol(0).getLamports().toNumber(), 0);
  t.equal(SolAmount.fromSol(1).getLamports().toNumber(), 1000000000);
  t.equal(SolAmount.fromSol(1.5).getLamports().toNumber(), 1500000000);
  t.equal(SolAmount.fromSol(42).getLamports().toNumber(), 42000000000);
  t.end();
});

test('it can return the lamports and SOLs as a BigNumber', (t: Test) => {
  t.equal(SolAmount.fromSol(1.5).getLamports().toNumber(), 1500000000);
  t.equal(SolAmount.fromSol(1.5).getSol().toNumber(), 1.5);
  t.end();
});

test('it can return the lamports and SOLs as a formatted strings', (t: Test) => {
  t.equal(SolAmount.fromSol(1.5).toLamports(), '1500000000');
  t.equal(SolAmount.fromSol(1.5).toSol(), '1.5');
  t.equal(SolAmount.fromSol(1.5).toSol(2), '1.50');
  t.equal(SolAmount.fromSol(1.5).toSol(9), '1.500000000');
  t.equal(SolAmount.fromSol(1.499).toSol(2), '1.50');
  t.equal(SolAmount.fromSol(1.499).toSol(2, BigNumber.ROUND_FLOOR), '1.49');
  t.end();
});

test('it returns the lamports when parsing as a string', (t: Test) => {
  t.equal(SolAmount.fromSol(0).toString(), '0');
  t.equal(SolAmount.fromSol(1).toString(), '1000000000');
  t.equal(SolAmount.fromSol(1.5).toString(), '1500000000');
  t.equal(SolAmount.fromLamports(42).toString(), '42');
  t.end();
});
