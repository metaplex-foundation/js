import type { Metadata } from '@/plugins';

/*
  Types specific to the ReadApi
*/

export type ReadApiInterface = 'V1_NFT';

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

export type ReadApiGroupKeys = 'collection';

export type ReadApiGroupingItem = {
  group_key: ReadApiGroupKeys;
  group_value: string;
};

export type ReadApiAuthorityScopes = 'full';

export type ReadApiAssetAuthority = {
  address: string;
  scopes: ReadApiAuthorityScopes[];
};
