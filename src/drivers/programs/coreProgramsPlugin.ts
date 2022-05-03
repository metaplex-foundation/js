import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Metaplex } from '@/Metaplex';
import { TokenProgramGpaBuilder } from '@/programs';
// import { MetaplexError } from '@/errors';

export const coreProgramsPlugin = {
  install(metaplex: Metaplex) {
    metaplex.programs().register({
      name: 'TokenProgram',
      address: TOKEN_PROGRAM_ID,
      clusterFilter: () => true,
      // errorResolver: (error) => new MetaplexError(error as Error),
      gpaResolver: (metaplex: Metaplex) => new TokenProgramGpaBuilder(metaplex, TOKEN_PROGRAM_ID),
    });
  },
};
