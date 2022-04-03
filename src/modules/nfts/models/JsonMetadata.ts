export interface JsonMetadata<Uri = string> {
  name?: string;
  symbol?: string;
  description?: string;
  seller_fee_basis_points?: number;
  image?: Uri;
  external_url?: Uri;
  attributes?: JsonMetadataAttribute[];
  properties?: {
    creators?: JsonMetadataCreator[];
    files?: JsonMetadataFile<Uri>[];
    [key: string]: unknown;
  };
  collection?: {
    name?: string;
    family?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface JsonMetadataAttribute {
  trait_type?: string;
  value?: unknown;
  [key: string]: unknown;
}

export interface JsonMetadataCreator {
  address?: string;
  share?: number;
  [key: string]: unknown;
}

export interface JsonMetadataFile<Uri = string> {
  type?: string;
  uri?: Uri;
  [key: string]: unknown;
}
