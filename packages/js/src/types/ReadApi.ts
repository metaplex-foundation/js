import type { Metadata } from '@/plugins';

/*
  Types specific to the ReadApi
*/

export type ReadApiInterface = 'V1_NFT';

export type ReadApiPropGroupKey = 'collection';

export type ReadApiPropSortBy = 'created' | 'updated' | 'recent_action';

export type ReadApiPropSortDirection = 'asc' | 'desc';

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
