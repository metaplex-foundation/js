import type { Metaplex } from '@/Metaplex';
import type { MetaplexPlugin } from '@/types';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  approveTokenDelegateAuthorityOperation,
  approveTokenDelegateAuthorityOperationHandler,
  createMintOperation,
  createMintOperationHandler,
  createTokenOperation,
  createTokenOperationHandler,
  createTokenWithMintOperation,
  createTokenWithMintOperationHandler,
  findMintByAddressOperation,
  findMintByAddressOperationHandler,
  findTokenByAddressOperation,
  findTokenByAddressOperationHandler,
  findTokenWithMintByAddressOperation,
  findTokenWithMintByAddressOperationHandler,
  findTokenWithMintByMintOperation,
  findTokenWithMintByMintOperationHandler,
  freezeTokensOperation,
  freezeTokensOperationHandler,
  mintTokensOperation,
  mintTokensOperationHandler,
  revokeTokenDelegateAuthorityOperation,
  revokeTokenDelegateAuthorityOperationHandler,
  sendTokensOperation,
  sendTokensOperationHandler,
  thawTokensOperation,
  thawTokensOperationHandler,
} from './operations';
import { TokenClient } from './TokenClient';
/**
 * @group Plugins
 */
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
