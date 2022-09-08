import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { MintGpaBuilder, TokenGpaBuilder } from './gpaBuilders';
import { Metaplex as MetaplexType } from '@/Metaplex';

/** @group Programs */
export const TokenProgram = {
  publicKey: TOKEN_PROGRAM_ID,

  mintAccounts(metaplex: MetaplexType) {
    return new MintGpaBuilder(metaplex, this.publicKey);
  },

  tokenAccounts(metaplex: MetaplexType) {
    return new TokenGpaBuilder(metaplex, this.publicKey);
  },
};
