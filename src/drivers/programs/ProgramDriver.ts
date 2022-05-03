import { PublicKey } from '@solana/web3.js';
import { Cluster, GpaBuilder } from '@/shared';
import { MetaplexError, MissingGpaBuilderError, ParsedProgramError } from '@/errors';
import { Driver } from '../Driver';
import { Program } from './Program';
import { UnknownProgramError } from '@/errors';

export abstract class ProgramDriver extends Driver {
  public abstract register(program: Program): void;
  public abstract all(): Program[];
  public abstract allForCluster(cluster: Cluster): Program[];
  public abstract allForCurrentCluster(): Program[];
  public abstract get(nameOrAddress: string | PublicKey): Program;

  public resolveError(nameOrAddress: string | PublicKey, error: unknown): MetaplexError {
    const program = this.get(nameOrAddress);

    if (!(error instanceof Error) || !('logs' in error) || !program.errorResolver) {
      return new UnknownProgramError(program, error as Error);
    }

    const resolvedError = program.errorResolver(error);

    if (!resolvedError) {
      return new UnknownProgramError(program, error);
    }

    return new ParsedProgramError(program, resolvedError);
  }

  public getGpaBuilder<T extends GpaBuilder>(nameOrAddress: string | PublicKey): T {
    const program = this.get(nameOrAddress);

    if (!program.gpaResolver) {
      throw new MissingGpaBuilderError(program);
    }

    return program.gpaResolver(this.metaplex) as T;
  }
}
