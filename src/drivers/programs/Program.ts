import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Cluster, GpaBuilder } from '@/shared';
import { MetaplexError } from '@/errors';

export type Program = {
  name: string;
  address: PublicKey;
  clusterFilter?: (cluster: Cluster) => boolean;
  errorResolver?: (error: unknown) => MetaplexError;
  gpaResolver?: (metaplex: Metaplex) => GpaBuilder;
};
