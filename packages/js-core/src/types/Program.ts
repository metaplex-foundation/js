import { PublicKey } from '@solana/web3.js';
import { Metaplex } from 'packages/js-core/src/Metaplex';
import { Cluster } from 'packages/js-core/src/types';
import { GpaBuilder } from 'packages/js-core/src/utils';

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
