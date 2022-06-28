import type { Metaplex } from '@/Metaplex';
import type { MetaplexPlugin } from '@/types';
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
import { TokenClient } from './TokenClient';

export const tokenModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const op = metaplex.operations();
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
