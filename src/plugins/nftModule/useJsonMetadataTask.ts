import { Metaplex } from '@/Metaplex';
import { useTask, Task } from '@/types';
import { JsonMetadata } from '../models/JsonMetadata';
import { Nft } from '../models/Nft';

export type JsonMetadataTask = Task<JsonMetadata>;

export const useJsonMetadataTask = (metaplex: Metaplex, nft: Nft): JsonMetadataTask =>
  useTask(({ signal }) => {
    return metaplex.storage().downloadJson<JsonMetadata>(nft.uri, { signal });
  });
