import type { Metaplex } from '@metaplex-foundation/js';

export type MetaplexPlugin = {
  install(metaplex: Metaplex): any;
};
