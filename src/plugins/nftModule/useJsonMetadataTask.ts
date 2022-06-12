import { Metaplex } from '@/Metaplex';
import { Task } from '@/utils';
import { JsonMetadata } from './JsonMetadata';
import { Nft } from './Nft';

export type JsonMetadataTask = Task<JsonMetadata>;

export const useJsonMetadataTask = (
  metaplex: Metaplex,
  nft: Nft
): JsonMetadataTask =>
  new Task(({ signal }) => {
    return metaplex.storage().downloadJson<JsonMetadata>(nft.uri, { signal });
  });
