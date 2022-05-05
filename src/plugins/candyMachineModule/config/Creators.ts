import { Creator } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKeyString } from '@/types';

export type CreatorConfig = Omit<Creator, 'address'> & {
  address: PublicKeyString;
};
export type CreatorsConfig = CreatorConfig[];

export function creatorsConfigDefault(owner: string): CreatorsConfig {
  return [
    {
      address: owner,
      verified: false,
      share: 100,
    },
  ];
}
