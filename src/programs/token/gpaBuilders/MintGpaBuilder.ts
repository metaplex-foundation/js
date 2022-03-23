import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { TokenProgramGpaBuilder } from './TokenProgramGpaBuilder';

export class MintGpaBuilder extends TokenProgramGpaBuilder {
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
