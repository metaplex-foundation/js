import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { TokenProgramGpaBuilder } from './TokenProgramGpaBuilder';

export class TokenGpaBuilder extends TokenProgramGpaBuilder {
  whereMint(mint: PublicKey) {
    return this.where(0, mint);
  }

  whereOwner(owner: PublicKey) {
    return this.where(32, owner);
  }

  whereAmount(amount: number | BN) {
    return this.where(64, amount);
  }

  whereDoesntHaveDelegate() {
    return this.where(72, 0);
  }

  whereHasDelegate() {
    return this.where(72, 1);
  }

  whereDelegate(delegate: PublicKey) {
    return this.whereHasDelegate().where(76, delegate);
  }

  // TODO: Map the rest of the layout.
  // https://github.com/solana-labs/solana-program-library/blob/master/token/js/src/state/account.ts#L59
}
