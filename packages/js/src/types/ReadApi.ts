/*
  Types specific to the ReadApi
*/

import type { Metadata } from '@/plugins';
import type { Option } from '@/utils';
import { ConcurrentMerkleTreeAccount } from '@solana/spl-account-compression';

export type ReadApiInterface = 'V1_NFT';

export type ReadApiPropGroupKey = 'collection';

export type ReadApiPropSortBy = 'created' | 'updated' | 'recent_action';

export type ReadApiPropSortDirection = 'asc' | 'desc';

export type TransferNftCompressionParam = {
  ownership?: ReadApiOwnershipMetadata;
  data?: ReadApiCompressionMetadata;
  assetProof?: GetAssetProofRpcResponse;
  merkleTree?: ConcurrentMerkleTreeAccount;
};

export type ReadApiParamAssetSortBy = {
  sortBy: ReadApiPropSortBy;
  sortDirection: ReadApiPropSortDirection;
};

export type ReadApiContent = {
  json_uri: string;
  metadata: Metadata['json'];
};

export type ReadApiCompressionMetadata = {
  eligible: boolean;
  compressed: boolean;
  data_hash: string;
  creator_hash: string;
  asset_hash: string;
  tree: string;
  seq: number;
  leaf_id: number;
};

export type ReadApiOwnershipMetadata = {
  frozen: boolean;
  delegated: boolean;
  delegate: string | null;
  owner: string;
  ownership_model: 'single' | 'token';
};

export type ReadApiSupplyMetadata = {
  edition_nonce: number;
  print_current_supply: number;
  print_max_supply: number;
};

export type ReadApiRoyaltyMetadata = {
  primary_sale_happened: boolean;
  basis_points: number;
};

export type ReadApiGroupingItem = {
  group_key: ReadApiPropGroupKey;
  group_value: string;
};

export type ReadApiAuthorityScope = 'full';

export type ReadApiAssetAuthority = {
  address: string;
  scopes: ReadApiAuthorityScope[];
};

export type GetAssetRpcInput = {
  id: string;
};

export type GetAssetRpcResponse = {
  id: string;
  interface: ReadApiInterface;
  content: ReadApiContent;
  authorities: Array<ReadApiAssetAuthority>;
  mutable: boolean;
  royalty: ReadApiRoyaltyMetadata;
  supply: ReadApiSupplyMetadata;
  creators: Metadata['creators'];
  grouping: Array<ReadApiGroupingItem>;
  compression: ReadApiCompressionMetadata;
  ownership: ReadApiOwnershipMetadata;
};

export type GetAssetProofRpcInput = {
  id: string;
};

export type GetAssetProofRpcResponse = {
  root: string;
  proof: string[];
  node_index: number;
  leaf: string;
  tree_id: string;
};

export type GetAssetsByGroupRpcInput = {
  groupKey: ReadApiPropGroupKey;
  groupValue: string;
  page?: Option<number>;
  limit?: Option<number>;
  /* assetId to search before */
  before?: Option<string>;
  /* assetId to search after */
  after?: Option<string>;
  sortBy?: Option<ReadApiParamAssetSortBy>;
};

export type GetAssetsByGroupRpcResponse = {
  total: number;
  limit: number;
  /**
   * `page` is only provided when using page based pagination, as apposed
   * to asset id before/after based pagination
   */
  page?: number;
  items: Array<GetAssetRpcResponse>;
};
