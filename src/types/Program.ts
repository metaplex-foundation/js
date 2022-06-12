import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Cluster } from '@/types';
import { GpaBuilder, TransactionBuilder } from '@/utils';
import {
  Account,
  MaybeAccount,
  UnparsedAccount,
  UnparsedMaybeAccount,
} from './Account';

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
  accounts: <T extends ProgramAccounts = ProgramAccounts>() => T;
  instructions: <T extends ProgramInstructions = ProgramInstructions>() => T;
};

export type ProgramAccounts = {
  get: <T>(name: string) => ProgramAccountClient<T>;
};

export type ProgramAccountClient<T> = {
  gpa: () => GpaBuilder;
  find: (address: PublicKey) => Promise<MaybeAccount<T>>;
  findAll: (addresses: PublicKey[]) => Promise<MaybeAccount<T>[]>;
  parse: {
    (unparsedAccount: UnparsedAccount): Account<T>;
    (unparsedAccount: UnparsedMaybeAccount): MaybeAccount<T>;
  };
};

export type ProgramInstructions = {
  get: <T extends object>(name: string, args: T) => TransactionBuilder;
};
