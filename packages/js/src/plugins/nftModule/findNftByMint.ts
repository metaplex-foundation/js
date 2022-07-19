import { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { findMasterEditionV2Pda, findMetadataPda } from './pdas';
import { toMetadataAccount, toOriginalOrPrintEditionAccount } from './accounts';
import { Operation, useOperation, OperationHandler } from '@/types';
import { DisposableScope } from '@/utils';
import { Nft, toNft } from './Nft';
import { toLazyMetadata } from './Metadata';
import { toNftEdition } from './NftEdition';
import { toMint, toMintAccount } from '../tokenModule';

// -----------------
// Operation
// -----------------

const Key = 'FindNftByMintOperation' as const;
export const findNftByMintOperation = useOperation<FindNftByMintOperation>(Key);
export type FindNftByMintOperation = Operation<
  typeof Key,
  FindNftByMintInput,
  Nft
>;

export type FindNftByMintInput = {
  mint: PublicKey;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const findNftByMintOperationHandler: OperationHandler<FindNftByMintOperation> =
  {
    handle: async (
      operation: FindNftByMintOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<Nft> => {
      const { mint, commitment } = operation.input;
      const accounts = await metaplex
        .rpc()
        .getMultipleAccounts(
          [mint, findMetadataPda(mint), findMasterEditionV2Pda(mint)],
          commitment
        );
      scope.throwIfCanceled();

      const mintAccount = toMintAccount(accounts[0]);
      const metadataAccount = toMetadataAccount(accounts[1]);
      const editionAccount = toOriginalOrPrintEditionAccount(accounts[2]);
      const lazyMetadata = toLazyMetadata(metadataAccount);

      const metadata = await metaplex
        .nfts()
        .loadMetadata(lazyMetadata)
        .run(scope);
      scope.throwIfCanceled();

      return toNft(metadata, toMint(mintAccount), toNftEdition(editionAccount));
    },
  };
