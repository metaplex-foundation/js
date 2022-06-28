import type { Metaplex } from '@/Metaplex';
import type { Commitment, PublicKey } from '@solana/web3.js';
import { findMintByAddressOperation } from './findMintByAddress';
import { findTokenByAddressOperation } from './findTokenByAddress';
import { findTokenWithMintByAddressOperation } from './findTokenWithMintByAddress';
import { findTokenWithMintByMintOperation } from './findTokenWithMintByMint';
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

  findTokenByAddress(address: PublicKey, commitment?: Commitment) {
    return this.metaplex
      .operations()
      .getTask(findTokenByAddressOperation({ address, commitment }));
  }

  findTokenWithMintByAddress(address: PublicKey, commitment?: Commitment) {
    return this.metaplex
      .operations()
      .getTask(findTokenWithMintByAddressOperation({ address, commitment }));
  }

  findTokenWithMintByMint(
    mintAddress: PublicKey,
    ownerAddress: PublicKey,
    commitment?: Commitment
  ) {
    return this.metaplex.operations().getTask(
      findTokenWithMintByMintOperation({
        mintAddress,
        ownerAddress,
        commitment,
      })
    );
  }
}
