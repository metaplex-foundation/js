import { PublicKey } from '@solana/web3.js';
import { ACCOUNT_SIZE, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { Metaplex } from '@/Metaplex';
import { GpaBuilder } from '@/utils';

export class TokenGpaBuilder extends GpaBuilder {
  constructor(metaplex: Metaplex, programId?: PublicKey) {
    super(metaplex, programId ?? TOKEN_PROGRAM_ID);
    this.whereSize(ACCOUNT_SIZE);
  }

  selectMint() {
    return this.slice(0, 32);
  }

  whereMint(mint: PublicKey) {
    return this.where(0, mint);
  }

  selectOwner() {
    return this.slice(32, 32);
  }

  whereOwner(owner: PublicKey) {
    return this.where(32, owner);
  }

  selectAmount() {
    return this.slice(64, 8);
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
