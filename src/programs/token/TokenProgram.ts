import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection } from '@solana/web3.js';
import { TokenProgramGpaBuilder } from './gpaBuilders';

export const TokenProgram = {
  publicKey: TOKEN_PROGRAM_ID,

  accounts(connection: Connection) {
    return new TokenProgramGpaBuilder(connection, this.publicKey);
  },

  mintAccounts(connection: Connection) {
    return this.accounts(connection).mintAccounts();
  },

  tokenAccounts(connection: Connection) {
    return this.accounts(connection).tokenAccounts();
  },
};
