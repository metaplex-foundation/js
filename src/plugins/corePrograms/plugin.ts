import { SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { cusper as tokenMetadataCusper } from '@metaplex-foundation/mpl-token-metadata';
import { cusper as auctionHouseCusper } from '@metaplex-foundation/mpl-auction-house';
import { Metaplex } from '@/Metaplex';
import {
  TokenMetadataGpaBuilder,
  TokenMetadataProgram,
  AuctionHouseProgram,
} from '@/programs';
import { ErrorWithLogs } from '@/types';

export const corePrograms = () => ({
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

    // Auction House Program.
    metaplex.programs().register({
      name: 'AuctionHouseProgram',
      address: AuctionHouseProgram.publicKey,
      errorResolver: (error: ErrorWithLogs) =>
        auctionHouseCusper.errorFromProgramLogs(error.logs, false),
    });
  },
});
