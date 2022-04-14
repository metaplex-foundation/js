import { GpaBuilder } from '../../../shared/index.js';
import { ACCOUNT_SIZE, MINT_SIZE } from '@solana/spl-token';
import { MintGpaBuilder, TokenGpaBuilder } from './index.js';

export class TokenProgramGpaBuilder extends GpaBuilder {
  mintAccounts() {
    return MintGpaBuilder.from(this).whereSize(MINT_SIZE);
  }

  tokenAccounts() {
    return TokenGpaBuilder.from(this).whereSize(ACCOUNT_SIZE);
  }
}
