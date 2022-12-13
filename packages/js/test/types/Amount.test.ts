import test, { Test } from 'tape';
import {
  Amount,
  formatAmount,
  addAmounts,
  subtractAmounts,
  multiplyAmount,
  divideAmount,
  isEqualToAmount,
  isLessThanAmount,
  isLessThanOrEqualToAmount,
  isGreaterThanAmount,
  isGreaterThanOrEqualToAmount,
  isZeroAmount,
  isPositiveAmount,
  isNegativeAmount,
  usd,
  sol,
  lamports,
  AmountMismatchError,
  toAmount,
  amountToString,
  toTokenAmount,
} from '@/index';

test('[Amount] it can create amounts from any types', (t: Test) => {
  const usdAmount = toAmount(1500, 'USD', 2);
  const gbpAmount = toAmount(4200, 'GBP', 2);

  t.equal(usdAmount.basisPoints.toString(), '1500');
  t.equal(usdAmount.identifier, 'USD');
  t.equal(usdAmount.decimals, 2);
  t.equal(gbpAmount.basisPoints.toString(), '4200');
  t.equal(gbpAmount.identifier, 'GBP');
  t.equal(gbpAmount.decimals, 2);
  t.end();
});

test('[Amount] it can be formatted', (t: Test) => {
  const percentAmount = toAmount(1234, '%', 2);
  const usdAmount = toAmount(1536, 'USD', 2);
  const gbpAmount = toAmount(4210, 'GBP', 2);
  const solAmount = toAmount(2_500_000_000, 'SOL', 9);
  const solAmountLeadingZeroDecimal = toAmount(2_005_000_000, 'SOL', 9);

  t.equal(amountToString(percentAmount), '12.34');
  t.equal(formatAmount(percentAmount), '12.34%');

  t.equal(amountToString(usdAmount), '15.36');
  t.equal(formatAmount(usdAmount), 'USD 15.36');

  t.equal(amountToString(gbpAmount), '42.10');
  t.equal(formatAmount(gbpAmount), 'GBP 42.10');

  t.equal(amountToString(solAmount), '2.500000000');
  t.equal(amountToString(solAmount, 2), '2.50');
  t.equal(formatAmount(solAmount), 'SOL 2.500000000');
  t.equal(formatAmount(solAmount, 2), 'SOL 2.50');

  t.equal(amountToString(solAmountLeadingZeroDecimal), '2.005000000');
  t.equal(formatAmount(solAmountLeadingZeroDecimal), 'SOL 2.005000000');
  t.end();
});

test('[Amount] it has helpers for certain currencies', (t: Test) => {
  amountEquals(t, usd(15.36), 'USD 15.36');
  amountEquals(t, usd(15.36), 'USD 15.36');
  amountEquals(t, toAmount(1536, 'USD', 2), 'USD 15.36');
  amountEquals(t, sol(2.5), 'SOL 2.500000000');
  amountEquals(t, lamports(2_500_000_000), 'SOL 2.500000000');
  amountEquals(t, toAmount(2_500_000_000, 'SOL', 9), 'SOL 2.500000000');
  t.end();
});

test('[Amount] it can create amounts representing SPL tokens', (t: Test) => {
  amountEquals(t, toTokenAmount(1), 'Token 1');
  amountEquals(t, toTokenAmount(4.5, 'DGEN'), 'DGEN 4');
  amountEquals(t, toTokenAmount(4.5, 'DGEN', 2), 'DGEN 4.50');
  amountEquals(t, toTokenAmount(6.2587, 'DGEN', 9), 'DGEN 6.258700000');
  t.end();
});

test('[Amount] it can add and subtract amounts together', (t: Test) => {
  const a = sol(1.5);
  const b = lamports(4200000000); // 4.2 SOL

  amountEquals(t, addAmounts(a, b), 'SOL 5.700000000');
  amountEquals(t, addAmounts(b, a), 'SOL 5.700000000');
  amountEquals(t, addAmounts(a, sol(1)), 'SOL 2.500000000');

  amountEquals(t, subtractAmounts(a, b), 'SOL -2.700000000');
  amountEquals(t, subtractAmounts(b, a), 'SOL 2.700000000');
  amountEquals(t, subtractAmounts(a, sol(1)), 'SOL 0.500000000');
  t.end();
});

test('[Amount] it fail to operate on amounts of different currencies', (t: Test) => {
  try {
    // @ts-ignore because we want to test the error.
    addAmounts(sol(1), usd(1));
    t.fail();
  } catch (error) {
    t.true(error instanceof AmountMismatchError);
    const customError = error as AmountMismatchError;
    t.equal(customError.left.identifier, 'SOL');
    t.equal(customError.right.identifier, 'USD');
    t.equal(customError.operation, 'add');
    t.end();
  }
});

test('[Amount] it can multiply and divide amounts', (t: Test) => {
  amountEquals(t, multiplyAmount(sol(1.5), 3), 'SOL 4.500000000');
  amountEquals(t, multiplyAmount(sol(1.5), 3.78), 'SOL 5.670000000');
  amountEquals(t, multiplyAmount(sol(1.5), -1), 'SOL -1.500000000');

  amountEquals(t, divideAmount(sol(1.5), 3), 'SOL 0.500000000');
  amountEquals(t, divideAmount(sol(1.5), 9), 'SOL 0.166666666');
  amountEquals(t, divideAmount(sol(1.5), -1), 'SOL -1.500000000');
  t.end();
});

test('[Amount] it can compare amounts together', (t: Test) => {
  const a = sol(1.5);
  const b = lamports(4200000000); // 4.2 SOL

  t.false(isEqualToAmount(a, b));
  t.true(isEqualToAmount(a, sol(1.5)));

  t.true(isLessThanAmount(a, b));
  t.false(isLessThanAmount(b, a));
  t.false(isLessThanAmount(a, sol(1.5)));
  t.true(isLessThanOrEqualToAmount(a, b));
  t.true(isLessThanOrEqualToAmount(a, sol(1.5)));

  t.false(isGreaterThanAmount(a, b));
  t.true(isGreaterThanAmount(b, a));
  t.false(isGreaterThanAmount(a, sol(1.5)));
  t.false(isGreaterThanOrEqualToAmount(a, b));
  t.true(isGreaterThanOrEqualToAmount(a, sol(1.5)));

  t.true(isPositiveAmount(a));
  t.false(isNegativeAmount(a));
  t.false(isZeroAmount(a));

  t.true(isPositiveAmount(sol(0)));
  t.false(isNegativeAmount(sol(0)));
  t.true(isZeroAmount(sol(0)));

  t.false(isPositiveAmount(sol(-1)));
  t.true(isNegativeAmount(sol(-1)));
  t.false(isZeroAmount(sol(-1)));

  t.end();
});

test('[Amount] it can compare amounts together with a tolerance', (t: Test) => {
  t.false(isEqualToAmount(sol(1.5), sol(1.6)));
  t.false(isEqualToAmount(sol(1.5), sol(1.6), sol(0.01)));
  t.true(isEqualToAmount(sol(1.5), sol(1.6), sol(0.1)));
  t.true(isEqualToAmount(sol(1.5), sol(1.6), sol(0.2)));

  t.end();
});

test('[Amount] it returns a new instance when running operations', (t: Test) => {
  const a = sol(1.5);
  const b = lamports(4200000000); // 4.2 SOL

  t.notEqual(a, addAmounts(a, b));
  t.notEqual(b, addAmounts(a, b));
  t.notEqual(a, subtractAmounts(a, b));
  t.notEqual(b, subtractAmounts(a, b));
  t.notEqual(a, multiplyAmount(a, 3));
  t.notEqual(a, divideAmount(a, 3));
  t.end();
});

const amountEquals = (t: Test, amount: Amount, expected: string) => {
  const actual = formatAmount(amount);
  t.equal(actual, expected, `${actual} === ${expected}`);
};
