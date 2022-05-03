import { SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { Metaplex } from '@/Metaplex';
import { TokenMetadataGpaBuilder, TokenProgramGpaBuilder } from '@/programs';

export const coreProgramsPlugin = {
  install(metaplex: Metaplex) {
    // System Program.
    metaplex.programs().register({
      name: 'SystemProgram',
      address: SystemProgram.programId,
    });

    // Token Program.
    metaplex.programs().register({
      name: 'TokenProgram',
      address: TOKEN_PROGRAM_ID,
      gpaResolver: (metaplex: Metaplex) => new TokenProgramGpaBuilder(metaplex, TOKEN_PROGRAM_ID),
    });

    // Token Metadata Program.
    metaplex.programs().register({
      name: 'TokenMetadataProgram',
      address: TOKEN_METADATA_PROGRAM_ID,
      gpaResolver: (metaplex: Metaplex) =>
        new TokenMetadataGpaBuilder(metaplex, TOKEN_METADATA_PROGRAM_ID),
    });
  },
};
