import { PublicKey } from "@solana/web3.js";
import { Specifications } from 'spok';

export function spokSamePubkey(a: PublicKey | null): Specifications<PublicKey> {
  const same = (b: PublicKey | null | undefined) => b != null && !!a?.equals(b);

  same.$spec = `spokSamePubkey(${a?.toBase58()})`;
  same.$description = `${a?.toBase58()} equal`;
  return same;
}
