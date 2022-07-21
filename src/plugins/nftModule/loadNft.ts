import { Commitment } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, OperationHandler } from '@/types';
import { DisposableScope } from '@/utils';
import { LazyNft, Nft, toNft } from './Nft';
import { toOriginalOrPrintEditionAccount } from './accounts';
import { findMasterEditionV2Pda } from './pdas';
import { toMint, toMintAccount } from '../tokenModule';
import { LazyMetadata } from './Metadata';
import { toNftEdition } from './NftEdition';

// -----------------
// Operation
// -----------------

const Key = 'LoadNftOperation' as const;
export const loadNftOperation = useOperation<LoadNftOperation>(Key);
export type LoadNftOperation = Operation<typeof Key, LoadNftInput, Nft>;

export type LoadNftInput = {
  nft: LazyNft;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const loadNftOperationHandler: OperationHandler<LoadNftOperation> = {
  handle: async (
    operation: LoadNftOperation,
    metaplex: Metaplex,
    scope: DisposableScope
  ): Promise<Nft> => {
    const { nft, commitment } = operation.input;
    const mint = nft.mintAddress;

    const accounts = await metaplex
      .rpc()
      .getMultipleAccounts([mint, findMasterEditionV2Pda(mint)], commitment);
    scope.throwIfCanceled();

    const mintAccount = toMintAccount(accounts[0]);
    const editionAccount = toOriginalOrPrintEditionAccount(accounts[1]);
    const lazyMetadata: LazyMetadata = {
      ...nft,
      model: 'metadata',
      address: nft.metadataAddress,
    };

    const metadata = await metaplex
      .nfts()
      .loadMetadata(lazyMetadata)
      .run(scope);
    scope.throwIfCanceled();

    return toNft(metadata, toMint(mintAccount), toNftEdition(editionAccount));
  },
};
