import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Cluster, GpaBuilder } from '@/shared';
import { MetaplexError } from '@/errors';

export type Program = {
  name: string;
  address: PublicKey;
  clusterFilter: (cluster: Cluster) => boolean;
  errorResolver: <T extends MetaplexError>(error: unknown) => T;
  gpaResolver: <T extends GpaBuilder>(metaplex: Metaplex) => T;
};
