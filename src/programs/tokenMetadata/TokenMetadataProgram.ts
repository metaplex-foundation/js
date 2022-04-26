import { PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { TokenMetadataGpaBuilder } from './gpaBuilders';
import { Metaplex } from '@/Metaplex';

export const TokenMetadataProgram = {
  publicKey: PROGRAM_ID,

  accounts(metaplex: Metaplex) {
    return new TokenMetadataGpaBuilder(metaplex, this.publicKey);
  },

  metadataV1Accounts(metaplex: Metaplex) {
    return this.accounts(metaplex).metadataV1Accounts();
  },
};
