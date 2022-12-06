import { Cluster } from './Cluster';
import type { PublicKey } from './PublicKey';

export type ErrorWithLogs = Error & { logs: string[] };
export type ErrorWithCode = Error & { code: number };

export const isErrorWithLogs = (error: unknown): error is ErrorWithLogs =>
  error instanceof Error && 'logs' in error;

export type Program = {
  name: string;
  address: PublicKey;
  clusterFilter?: (cluster: Cluster) => boolean;
  errorResolver?: (error: ErrorWithLogs) => ErrorWithCode | null | undefined;
};
