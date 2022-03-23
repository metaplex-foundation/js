import { Connection } from '@solana/web3.js';
import { PROGRAM_ID } from './generated';
import { TokenMetadataGpaBuilder } from './gpaBuilders';

export const TokenMetadataProgram = {
  publicKey: PROGRAM_ID,

  accounts(connection: Connection) {
    return new TokenMetadataGpaBuilder(connection, this.publicKey);
  },

  metadataV1Accounts(connection: Connection) {
    return this.accounts(connection).metadataV1Accounts();
  },
};
