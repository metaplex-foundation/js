import { Metaplex } from '@/Metaplex';

export type Plugin = {
  install(metaplex: Metaplex): void;
};
