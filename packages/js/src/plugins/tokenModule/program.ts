import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { MintGpaBuilder, TokenGpaBuilder } from './gpaBuilders';
import { Metaplex } from '@/Metaplex';

/** @group Programs */
export const TokenProgram = {
  publicKey: TOKEN_PROGRAM_ID,

  mintAccounts(metaplex: Metaplex) {
    return new MintGpaBuilder(metaplex, this.publicKey);
  },

  tokenAccounts(metaplex: Metaplex) {
    return new TokenGpaBuilder(metaplex, this.publicKey);
  },
};
