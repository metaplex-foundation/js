import type { Metaplex } from '@/Metaplex';
import type { Commitment, PublicKey } from '@solana/web3.js';
import { findMintByAddressOperation } from './findMintByAddress';
import { TokenBuildersClient } from './TokenBuildersClient';

export class TokenClient {
  constructor(protected readonly metaplex: Metaplex) {}

  builders() {
    return new TokenBuildersClient(this.metaplex);
  }

  findMintByAddress(address: PublicKey, commitment?: Commitment) {
    return this.metaplex
      .operations()
      .getTask(findMintByAddressOperation({ address, commitment }));
  }
}
