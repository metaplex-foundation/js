import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import { Metadata, Nft, NftWithToken, Sft, SftWithToken } from '../models';
import type { NftClient } from '../NftClient';

// -----------------
// Clients
// -----------------

/** @internal */
export function _loadMetadataClient(
  this: NftClient,
  metadata: Metadata,
  options?: Omit<LoadMetadataInput, 'metadata'>
) {
  return this.metaplex
    .operations()
    .getTask(loadMetadataOperation({ metadata, ...options }));
}

// -----------------
// Operation
// -----------------

const Key = 'LoadMetadataOperation' as const;
export const loadMetadataOperation = useOperation<LoadMetadataOperation>(Key);
export type LoadMetadataOperation = Operation<
  typeof Key,
  LoadMetadataInput,
  LoadMetadataOutput
>;

export type LoadMetadataInput = {
  metadata: Metadata;
  tokenAddress?: PublicKey;
  tokenOwner?: PublicKey;
  loadJsonMetadata?: boolean;
  commitment?: Commitment;
};

export type LoadMetadataOutput = Nft | Sft | NftWithToken | SftWithToken;

// -----------------
// Handler
// -----------------

export const loadMetadataOperationHandler: OperationHandler<LoadMetadataOperation> =
  {
    handle: async (
      operation: LoadMetadataOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<LoadMetadataOutput> => {
      const { metadata, loadJsonMetadata = true } = operation.input;

      let nftOrSft = await metaplex
        .nfts()
        .findByMint(metadata.mintAddress, {
          ...operation.input,
          loadJsonMetadata: !metadata.jsonLoaded && loadJsonMetadata,
        })
        .run(scope);

      if (!nftOrSft.jsonLoaded && metadata.jsonLoaded) {
        nftOrSft = { ...nftOrSft, json: metadata.json, jsonLoaded: true };
      }

      return nftOrSft;
    },
  };
