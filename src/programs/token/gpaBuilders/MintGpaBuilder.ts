import { PublicKey } from '@solana/web3.js';
import { MINT_SIZE, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { Metaplex } from '@/Metaplex';
import { GpaBuilder } from '@/utils';

export class MintGpaBuilder extends GpaBuilder {
  constructor(metaplex: Metaplex, programId?: PublicKey) {
    super(metaplex, programId ?? TOKEN_PROGRAM_ID);
    this.whereSize(MINT_SIZE);
  }

  whereDoesntHaveMintAuthority() {
    return this.where(0, 0);
  }

  whereHasMintAuthority() {
    return this.where(0, 1);
  }

  whereMintAuthority(mintAuthority: PublicKey) {
    return this.whereHasMintAuthority().where(4, mintAuthority);
  }

  whereSupply(supply: number | BN) {
    return this.where(36, supply);
  }

  // TODO: Map the rest of the layout.
  // https://github.com/solana-labs/solana-program-library/blob/master/token/js/src/state/mint.ts#L43
}
