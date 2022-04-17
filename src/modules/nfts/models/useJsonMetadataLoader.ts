import { Metaplex } from '@/Metaplex';
import { useLoader, Loader } from '@/shared';
import { JsonMetadata } from './JsonMetadata';
import { Nft } from './Nft';

export type JsonMetadataLoader = Loader<JsonMetadata>;

export const useJsonMetadataLoader = (metaplex: Metaplex, nft: Nft): JsonMetadataLoader =>
  useLoader(() => {
    return metaplex.storage().downloadJson<JsonMetadata>(nft.uri);
  });
