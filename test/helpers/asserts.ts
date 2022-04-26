import { PublicKey, RpcResponseAndContext, SignatureResult } from '@solana/web3.js';
import { bignum } from '@metaplex-foundation/beet';
import { cusper as cusperTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import BN from 'bn.js';
import { Specification, Specifications } from 'spok';
import { Test } from 'tape';
import { resolveTransactionError } from './amman';

export function spokSamePubkey(
  a: PublicKey | string | null | undefined
): Specifications<PublicKey> {
  const keyStr = typeof a === 'string' ? a : a?.toString();
  const key = typeof a === 'string' ? new PublicKey(a) : a;
  const same = (b: PublicKey | null | undefined) => b != null && !!key?.equals(b);

  same.$spec = `spokSamePubkey(${keyStr})`;
  same.$description = `${keyStr} equal`;
  return same;
}

export function spokSameBignum(a: BN | bignum | number): Specification<bignum> {
  const same = (b?: BN | bignum | number) => b != null && new BN(a).eq(new BN(b));

  same.$spec = `spokSameBignum(${a})`;
  same.$description = `${a} equal`;
  return same;
}

export function assertConfirmedWithoutError(
  t: Test,
  cusper: typeof cusperTokenMetadata,
  confirmed: RpcResponseAndContext<SignatureResult>
) {
  if (confirmed.value.err == null) {
    t.pass('confirmed without error');
  } else {
    t.fail(resolveTransactionError(cusper, confirmed.value.err).stack);
  }
}

export async function assertThrowsAsync<T>(
  t: Test,
  promise: Promise<T>,
  match: RegExp
): Promise<void> {
  try {
    await promise;
    t.fail(`expected error to throw ${match.toString()}`);
  } catch {
    t.pass(`throws ${match.toString()}`);
  }
}
