import type { Metaplex } from '@/Metaplex';
import type { MetaplexPlugin } from '@/types';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  approveTokenDelegateAuthorityOperation,
  approveTokenDelegateAuthorityOperationHandler,
} from './approveTokenDelegateAuthority';
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
import {
  freezeTokensOperation,
  freezeTokensOperationHandler,
} from './freezeTokens';
import { mintTokensOperation, mintTokensOperationHandler } from './mintTokens';
import {
  revokeTokenDelegateAuthorityOperation,
  revokeTokenDelegateAuthorityOperationHandler,
} from './revokeTokenDelegateAuthority';
import { sendTokensOperation, sendTokensOperationHandler } from './sendTokens';
import { thawTokensOperation, thawTokensOperationHandler } from './thawTokens';
import { TokenClient } from './TokenClient';

/** @group Plugins */
export const tokenModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    // Program.
    metaplex.programs().register({
      name: 'TokenProgram',
      address: TOKEN_PROGRAM_ID,
    });

    // Operations.
    const op = metaplex.operations();
    op.register(
      approveTokenDelegateAuthorityOperation,
      approveTokenDelegateAuthorityOperationHandler
    );
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
    op.register(freezeTokensOperation, freezeTokensOperationHandler);
    op.register(mintTokensOperation, mintTokensOperationHandler);
    op.register(
      revokeTokenDelegateAuthorityOperation,
      revokeTokenDelegateAuthorityOperationHandler
    );
    op.register(sendTokensOperation, sendTokensOperationHandler);
    op.register(thawTokensOperation, thawTokensOperationHandler);

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
