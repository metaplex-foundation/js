import type { bignum } from '@metaplex-foundation/beet';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Specification, Specifications } from 'spok';
import { Test } from 'tape';
import { Amount, BigNumber, sameAmounts } from '@/types';

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
  a: BN | bignum | number | null | undefined | BigNumber
): Specification<bignum | BigNumber> {
  const same = (b?: BN | bignum | number) => {
    if (a == null) return b == null;
    return b != null && new BN(a).eq(new BN(b));
  };

  same.$spec = `spokSameBignum(${a})`;
  same.$description = `${a} equal`;
  return same;
}

export function spokSameAmount(a: Amount): Specification<Amount> {
  const same = (b?: Amount): boolean => {
    return !!b && sameAmounts(a, b);
  };

  same.$spec = `spokSameAmount(${a})`;
  same.$description = `${a} equal`;
  return same;
}

export async function assertThrows<T>(
  t: Test,
  fnOrPromise: (() => any) | Promise<T>,
  match: RegExp
): Promise<void> {
  await assertThrowsFn(
    t,
    fnOrPromise,
    (error: any) => {
      const message: string = error?.toString() ?? error?.message ?? '';
      if (message.match(match)) {
        t.pass(`throws ${match.toString()}`);
      } else {
        t.fail(`expected to throw ${match.toString()}, got ${message}`);
      }
    },
    match.toString()
  );
}

export async function assertThrowsFn<T>(
  t: Test,
  fnOrPromise: (() => any) | Promise<T>,
  onError: (error: any) => void,
  expectedError = 'an error'
): Promise<void> {
  try {
    if (typeof fnOrPromise === 'function') {
      await fnOrPromise();
    } else {
      await fnOrPromise;
    }
    t.fail(`expected to throw ${expectedError}`);
  } catch (error: any) {
    onError(error);
  }
}
