import type { Metaplex } from 'packages/js-core/src/Metaplex';

export type MetaplexPlugin = {
  install(metaplex: Metaplex): any;
};
