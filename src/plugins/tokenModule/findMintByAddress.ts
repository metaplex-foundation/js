import type { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import {
  Operation,
  useOperation,
  OperationHandler,
  assertAccountExists,
} from '@/types';
import { makeMintModel, Mint } from './Mint';
import { DisposableScope } from '@/utils';
import { parseMintAccount } from './accounts';

const Key = 'FindMintByAddressOperation' as const;
export const findMintByAddressOperation =
  useOperation<FindMintByAddressOperation>(Key);
export type FindMintByAddressOperation = Operation<
  typeof Key,
  FindMintByAddressInput,
  Mint
>;

export type FindMintByAddressInput = {
  address: PublicKey;
  commitment?: Commitment;
};

export const findMintByAddressOnChainOperationHandler: OperationHandler<FindMintByAddressOperation> =
  {
    handle: async (
      operation: FindMintByAddressOperation,
      metaplex: Metaplex,
      { throwIfCanceled }: DisposableScope
    ): Promise<Mint> => {
      const { address, commitment } = operation.input;

      const account = parseMintAccount(
        await metaplex.rpc().getAccount(address, commitment)
      );

      assertAccountExists(account, 'Mint');

      return makeMintModel(account);
    },
  };
