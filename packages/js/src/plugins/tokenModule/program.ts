import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { MintGpaBuilder, TokenGpaBuilder } from './gpaBuilders';
import { Metaplex } from '@/Metaplex';
import { Program } from '@/types';

/** @group Programs */
export const TokenProgram: Program = {
  name: 'TokenProgram',
  address: TOKEN_PROGRAM_ID,

  mintAccounts(metaplex: Metaplex) {
    return new MintGpaBuilder(metaplex, this.address);
  },

  tokenAccounts(metaplex: Metaplex) {
    return new TokenGpaBuilder(metaplex, this.address);
  },
};
