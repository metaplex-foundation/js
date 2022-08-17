import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import { Metadata, Nft, NftWithToken, Sft, SftWithToken } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'LoadMetadataOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const loadMetadataOperation = useOperation<LoadMetadataOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type LoadMetadataOperation = Operation<
  typeof Key,
  LoadMetadataInput,
  LoadMetadataOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type LoadMetadataInput = {
  metadata: Metadata;
  tokenAddress?: PublicKey;
  tokenOwner?: PublicKey;
  loadJsonMetadata?: boolean;
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Outputs
 */
export type LoadMetadataOutput = Nft | Sft | NftWithToken | SftWithToken;

/**
 * @group Operations
 * @category Handlers
 */
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
        .findByMint({
          ...operation.input,
          mintAddress: metadata.mintAddress,
          loadJsonMetadata: !metadata.jsonLoaded && loadJsonMetadata,
        })
        .run(scope);

      if (!nftOrSft.jsonLoaded && metadata.jsonLoaded) {
        nftOrSft = { ...nftOrSft, json: metadata.json, jsonLoaded: true };
      }

      return nftOrSft;
    },
  };
