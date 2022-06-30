import { SystemProgram } from '@solana/web3.js';
import { cusper as tokenMetadataCusper } from '@metaplex-foundation/mpl-token-metadata';
import { Metaplex } from '@/Metaplex';
import { TokenMetadataGpaBuilder, TokenMetadataProgram } from '@/programs';
import { ErrorWithLogs } from '@/types';

export const corePrograms = () => ({
  install(metaplex: Metaplex) {
    // System Program.
    metaplex.programs().register({
      name: 'SystemProgram',
      address: SystemProgram.programId,
    });

    // Token Metadata Program.
    metaplex.programs().register({
      name: 'TokenMetadataProgram',
      address: TokenMetadataProgram.publicKey,
      errorResolver: (error: ErrorWithLogs) =>
        tokenMetadataCusper.errorFromProgramLogs(error.logs, false),
      gpaResolver: (metaplex: Metaplex) =>
        new TokenMetadataGpaBuilder(metaplex, TokenMetadataProgram.publicKey),
    });
  },
});
