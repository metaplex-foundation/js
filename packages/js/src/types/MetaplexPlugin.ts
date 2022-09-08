import type { Metaplex as MetaplexType } from '@/Metaplex';

export type MetaplexPlugin = {
  install(metaplex: MetaplexType): any;
};
