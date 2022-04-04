import test, { Test } from 'tape';
import { SolAmount } from '@/index';

test('it can create a SolAmount from lamports', (t: Test) => {
  t.equal(SolAmount.fromLamports(0).toLamports().toNumber(), 0);
  t.equal(SolAmount.fromLamports(1).toLamports().toNumber(), 1);
  t.equal(SolAmount.fromLamports(42).toLamports().toNumber(), 42);
  t.end();
});

test('it can create a SolAmount from SOLs', (t: Test) => {
  t.equal(SolAmount.fromSol(0).toLamports().toNumber(), 0);
  t.equal(SolAmount.fromSol(1).toLamports().toNumber(), 1000000000);
  t.equal(SolAmount.fromSol(1.5).toLamports().toNumber(), 1500000000);
  t.equal(SolAmount.fromSol(42).toLamports().toNumber(), 42000000000);
  t.end();
});

test('it returns the lamports when parsing as a string', (t: Test) => {
  t.equal(SolAmount.fromSol(0).toString(), '0');
  t.equal(SolAmount.fromSol(1).toString(), '1000000000');
  t.equal(SolAmount.fromSol(1.5).toString(), '1500000000');
  t.equal(SolAmount.fromLamports(42).toString(), '42');
  t.end();
});
