import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Cluster, GpaBuilder } from '@/shared';

export type ErrorWithLogs = Error & { logs: string[] };
export type ErrorWithCode = Error & { code: number };

export type Program = {
  name: string;
  address: PublicKey;
  clusterFilter?: (cluster: Cluster) => boolean;
  errorResolver?: (error: ErrorWithLogs) => ErrorWithCode | null | undefined;
  gpaResolver?: (metaplex: Metaplex) => GpaBuilder;
};
