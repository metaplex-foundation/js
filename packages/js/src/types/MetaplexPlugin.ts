import type { Metaplex } from '@metaplex-foundation/js-core/Metaplex';

export type MetaplexPlugin = {
  install(metaplex: Metaplex): any;
};
