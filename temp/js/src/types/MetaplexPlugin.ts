import type { Metaplex } from '@metaplex-foundation/js-core';

export type MetaplexPlugin = {
  install(metaplex: Metaplex): any;
};
