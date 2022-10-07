import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js-core/Metaplex';
import { Cluster } from '@metaplex-foundation/js-core';
import { GpaBuilder } from '@metaplex-foundation/js-core/utils';

export type ErrorWithLogs = Error & { logs: string[] };
export type ErrorWithCode = Error & { code: number };

export const isErrorWithLogs = (error: unknown): error is ErrorWithLogs =>
  error instanceof Error && 'logs' in error;

export type Program = {
  name: string;
  address: PublicKey;
  clusterFilter?: (cluster: Cluster) => boolean;
  errorResolver?: (error: ErrorWithLogs) => ErrorWithCode | null | undefined;
  gpaResolver?: (metaplex: Metaplex) => GpaBuilder;
};
