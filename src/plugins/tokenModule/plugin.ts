import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { Metaplex } from '@/Metaplex';
import type { MetaplexPlugin } from '@/types';
import { TokenClient } from './TokenClient';
import { createMintOperation, createMintOperationHandler } from './createMint';
import {
  createTokenOperation,
  createTokenOperationHandler,
} from './createToken';
import {
  createTokenWithMintOperation,
  createTokenWithMintOperationHandler,
} from './createTokenWithMint';
import {
  findMintByAddressOperation,
  findMintByAddressOperationHandler,
} from './findMintByAddress';
import {
  findTokenByAddressOperation,
  findTokenByAddressOperationHandler,
} from './findTokenByAddress';
import {
  findTokenWithMintByAddressOperation,
  findTokenWithMintByAddressOperationHandler,
} from './findTokenWithMintByAddress';
import {
  findTokenWithMintByMintOperation,
  findTokenWithMintByMintOperationHandler,
} from './findTokenWithMintByMint';
import { mintTokensOperation, mintTokensOperationHandler } from './mintTokens';
import { sendTokensOperation, sendTokensOperationHandler } from './sendTokens';

export const tokenModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    // Program.
    metaplex.programs().register({
      name: 'TokenProgram',
      address: TOKEN_PROGRAM_ID,
    });

    // Operations.
    const op = metaplex.operations();
    op.register(createMintOperation, createMintOperationHandler);
    op.register(createTokenOperation, createTokenOperationHandler);
    op.register(
      createTokenWithMintOperation,
      createTokenWithMintOperationHandler
    );
    op.register(findMintByAddressOperation, findMintByAddressOperationHandler);
    op.register(
      findTokenByAddressOperation,
      findTokenByAddressOperationHandler
    );
    op.register(
      findTokenWithMintByAddressOperation,
      findTokenWithMintByAddressOperationHandler
    );
    op.register(
      findTokenWithMintByMintOperation,
      findTokenWithMintByMintOperationHandler
    );
    op.register(mintTokensOperation, mintTokensOperationHandler);
    op.register(sendTokensOperation, sendTokensOperationHandler);

    metaplex.tokens = function () {
      return new TokenClient(this);
    };
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    tokens(): TokenClient;
  }
}
