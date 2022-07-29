import { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, OperationHandler } from '@/types';
import { DisposableScope } from '@/utils';
import { NftWithToken } from './Nft';
import { toTokenAccount } from '../tokenModule';
import { SftWithToken } from './Sft';

// -----------------
// Operation
// -----------------

const Key = 'FindNftByTokenOperation' as const;
export const findNftByTokenOperation =
  useOperation<FindNftByTokenOperation>(Key);
export type FindNftByTokenOperation = Operation<
  typeof Key,
  FindNftByTokenInput,
  FindNftByTokenOutput
>;

export type FindNftByTokenInput = {
  token: PublicKey;
  loadJsonMetadata?: boolean;
  commitment?: Commitment;
};

export type FindNftByTokenOutput = NftWithToken | SftWithToken;

// -----------------
// Handler
// -----------------

export const findNftByTokenOperationHandler: OperationHandler<FindNftByTokenOperation> =
  {
    handle: async (
      operation: FindNftByTokenOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindNftByTokenOutput> => {
      const token = toTokenAccount(
        await metaplex.rpc().getAccount(operation.input.token)
      );
      scope.throwIfCanceled();

      const asset = await metaplex
        .nfts()
        .findByMint(token.data.mint, {
          ...operation.input,
          token: { address: operation.input.token },
        })
        .run(scope);

      return asset as FindNftByTokenOutput;
    },
  };
