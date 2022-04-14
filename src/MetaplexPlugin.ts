import { Metaplex } from './Metaplex.js';

export type MetaplexPlugin = {
  install(metaplex: Metaplex): any;
};
