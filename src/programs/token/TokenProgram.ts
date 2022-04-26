import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TokenProgramGpaBuilder } from './gpaBuilders';
import { Metaplex } from '@/Metaplex';

export const TokenProgram = {
  publicKey: TOKEN_PROGRAM_ID,

  accounts(metaplex: Metaplex) {
    return new TokenProgramGpaBuilder(metaplex, this.publicKey);
  },

  mintAccounts(metaplex: Metaplex) {
    return this.accounts(metaplex).mintAccounts();
  },

  tokenAccounts(metaplex: Metaplex) {
    return this.accounts(metaplex).tokenAccounts();
  },
};
