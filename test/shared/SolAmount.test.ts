import BigNumber from 'bignumber.js';
import test, { Test } from 'tape';
import { SolAmount } from '../../src/index.js';

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

test('it can add and subtract SolAmounts together', (t: Test) => {
  const a = SolAmount.fromSol(1.5);
  const b = SolAmount.fromLamports(4200000000); // 4.2 SOL

  t.equal(a.plus(b).toSol(), '5.7');
  t.equal(b.plus(a).toSol(), '5.7');
  t.equal(a.plus(1).toSol(), '2.5'); // Scalar assumes SOL.

  t.equal(a.minus(b).toSol(), '-2.7');
  t.equal(b.minus(a).toSol(), '2.7');
  t.equal(a.minus(1).toSol(), '0.5'); // Scalar assumes SOL.
  t.end();
});

test('it can multiply and divide SolAmounts together', (t: Test) => {
  const a = SolAmount.fromSol(1.5);
  const b = SolAmount.fromLamports(4200000000); // 4.2 SOL

  t.equal(a.multipliedBy(b).toSol(), '6.3');
  t.equal(b.multipliedBy(a).toSol(), '6.3');
  t.equal(a.multipliedBy(5).toSol(), '7.5');

  t.equal(a.dividedBy(b).toSol(3), '0.357');
  t.equal(b.dividedBy(a).toSol(), '2.8');
  t.equal(a.dividedBy(5).toSol(), '0.3');
  t.end();
});

test('it can find the modulo of a SolAmount', (t: Test) => {
  t.equal(SolAmount.fromSol(42).modulo(10).toSol(), '2');
  t.equal(SolAmount.fromSol(54).modulo(7).toSol(), '5');
  t.end();
});

test('it can compare SolAmounts together', (t: Test) => {
  const a = SolAmount.fromSol(1.5);
  const b = SolAmount.fromLamports(4200000000); // 4.2 SOL

  t.true(a.isLessThan(b));
  t.false(b.isLessThan(a));
  t.false(a.isLessThan(1.5));

  t.true(a.isLessThanOrEqualTo(b));
  t.true(a.isLessThanOrEqualTo(1.5));

  t.false(a.isGreaterThan(b));
  t.true(b.isGreaterThan(a));
  t.false(a.isGreaterThan(1.5));

  t.false(a.isGreaterThanOrEqualTo(b));
  t.true(a.isGreaterThanOrEqualTo(1.5));

  t.false(a.isEqualTo(b));
  t.true(a.isEqualTo(1.5));

  t.true(a.isPositive());
  t.false(a.isNegative());
  t.false(a.isZero());

  t.true(SolAmount.fromSol(0).isPositive());
  t.false(SolAmount.fromSol(0).isNegative());
  t.true(SolAmount.fromSol(0).isZero());

  t.false(SolAmount.fromSol(-1).isPositive());
  t.true(SolAmount.fromSol(-1).isNegative());
  t.false(SolAmount.fromSol(-1).isZero());

  t.end();
});

test('it returns a new instance when running operations', (t: Test) => {
  const a = SolAmount.fromSol(1.5);
  const b = SolAmount.fromLamports(4200000000); // 4.2 SOL

  t.notEqual(a, a.plus(b));
  t.notEqual(b, a.plus(b));
  t.notEqual(a, a.minus(b));
  t.notEqual(b, a.minus(b));
  t.notEqual(a, a.multipliedBy(b));
  t.notEqual(b, a.multipliedBy(b));
  t.notEqual(a, a.dividedBy(b));
  t.notEqual(b, a.dividedBy(b));
  t.end();
});
