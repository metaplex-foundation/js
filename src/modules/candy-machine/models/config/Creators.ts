import { Creator } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKeyString } from '../../../../shared';

export type CreatorConfig = Creator & {
  address: PublicKeyString;
};
export type CreatorsConfig = CreatorConfig[];
