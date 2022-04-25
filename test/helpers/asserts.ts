import { PublicKey, RpcResponseAndContext, SignatureResult } from '@solana/web3.js';
import { bignum } from '@metaplex-foundation/beet';
import { cusper as cusperTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import BN from 'bn.js';
import { Specification } from 'spok';
import { Test } from 'tape';
import { resolveTransactionError } from './amman';

export function spokSamePubkey(a: PublicKey | null): Specification<PublicKey> {
  const same = (b: PublicKey | null | undefined) => b != null && !!a?.equals(b);

  same.$spec = `spokSamePubkey(${a?.toBase58()})`;
  same.$description = `${a?.toBase58()} equal`;
  return same;
}

export function spokSameBignum(a: BN | bignum): Specification<bignum> {
  const same = (b?: BN | bignum) => b != null && new BN(a).eq(new BN(b));

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

