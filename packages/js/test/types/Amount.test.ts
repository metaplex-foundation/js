import test, { Test } from 'tape';
import {
  Amount,
  amount,
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
  USD,
  SOL,
  CurrencyMismatchError,
  token,
} from '@/index';

test('[Amount] it can create amounts from any currencies', (t: Test) => {
  const usdAmount = amount(1500, { symbol: 'USD', decimals: 2 });
  const gbpAmount = amount(4200, { symbol: 'GBP', decimals: 2 });

  t.equal(usdAmount.basisPoints.toNumber(), 1500);
  t.equal(usdAmount.currency.symbol, 'USD');
  t.equal(gbpAmount.basisPoints.toNumber(), 4200);
  t.equal(gbpAmount.currency.symbol, 'GBP');
  t.end();
});

test('[Amount] it can be formatted', (t: Test) => {
  const usdAmount = amount(1536, { symbol: 'USD', decimals: 2 });
  const gbpAmount = amount(4210, { symbol: 'GBP', decimals: 2 });
  const solAmount = amount(2_500_000_000, { symbol: 'SOL', decimals: 9 });
  const solAmountLeadingZeroDecimal = amount(2_005_000_000, {
    symbol: 'SOL',
    decimals: 9,
  });

  t.equal(formatAmount(usdAmount), 'USD 15.36');
  t.equal(formatAmount(gbpAmount), 'GBP 42.10');
  t.equal(formatAmount(solAmount), 'SOL 2.500000000');
  t.equal(formatAmount(solAmountLeadingZeroDecimal), 'SOL 2.005000000');
  t.end();
});

test('[Amount] it has helpers for certain currencies', (t: Test) => {
  amountEquals(t, usd(15.36), 'USD 15.36');
  amountEquals(t, usd(15.36), 'USD 15.36');
  amountEquals(t, amount(1536, USD), 'USD 15.36');
  amountEquals(t, sol(2.5), 'SOL 2.500000000');
  amountEquals(t, lamports(2_500_000_000), 'SOL 2.500000000');
  amountEquals(t, amount(2_500_000_000, SOL), 'SOL 2.500000000');
  t.end();
});

test('[Amount] it can create amounts representing SPL tokens', (t: Test) => {
  t.equal(token(1).currency.namespace, 'spl-token');
  amountEquals(t, token(1), 'Token 1');
  amountEquals(t, token(4.5, 2), 'Token 4.50');
  amountEquals(t, token(6.2587, 9, 'DGEN'), 'DGEN 6.258700000');
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
    t.true(error instanceof CurrencyMismatchError);
    const customError = error as CurrencyMismatchError;
    t.equal(customError.left, SOL);
    t.equal(customError.right, USD);
    t.equal(customError.operation, 'add');
    t.end();
  }
});

test('[Amount] it can multiply and divide amounts', (t: Test) => {
  amountEquals(t, multiplyAmount(sol(1.5), 3), 'SOL 4.500000000');
  amountEquals(t, multiplyAmount(sol(1.5), 3.78), 'SOL 5.659262581');
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
