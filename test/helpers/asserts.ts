import { PublicKey } from '@solana/web3.js';
import { bignum } from '@metaplex-foundation/beet';
import BN from 'bn.js';
import { Specification, Specifications } from 'spok';
import { Test } from 'tape';

export function spokSamePubkey(
  a: PublicKey | string | null | undefined
): Specifications<PublicKey> {
  const keyStr = typeof a === 'string' ? a : a?.toString();
  const key = typeof a === 'string' ? new PublicKey(a) : a;
  const same = (b: PublicKey | null | undefined) =>
    b != null && !!key?.equals(b);

  same.$spec = `spokSamePubkey(${keyStr})`;
  same.$description = `${keyStr} equal`;
  return same;
}

export function spokSameBignum(
  a: BN | bignum | number | null | undefined
): Specification<bignum> {
  const same = (b?: BN | bignum | number) => {
    if (a == null) return b == null;
    return b != null && new BN(a).eq(new BN(b));
  };

  same.$spec = `spokSameBignum(${a})`;
  same.$description = `${a} equal`;
  return same;
}

async function assertThrowsOnResolve<T>(
  t: Test,
  promise: Promise<T>,
  match: RegExp
): Promise<void> {
  try {
    await promise;
    t.fail(`expected to throw ${match.toString()}`);
  } catch {
    t.pass(`throws ${match.toString()}`);
  }
}

export async function assertThrows<T>(
  t: Test,
  fnOrPromise: (() => any) | Promise<T>,
  match: RegExp
): Promise<void> {
  if (typeof fnOrPromise === 'function') {
    try {
      // could throw synchronously or if the function returns a promise its
      // resolution may throw
      await fnOrPromise();
      t.fail(`expected to throw ${match.toString()}`);
    } catch {
      t.pass(`throws ${match.toString()}`);
    }
  } else {
    return assertThrowsOnResolve(t, fnOrPromise, match);
  }
}
