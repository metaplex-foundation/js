import { PublicKey } from '@solana/web3.js';
import { bignum } from '@metaplex-foundation/beet';
import BN from 'bn.js';
import { Specification } from 'spok';

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
