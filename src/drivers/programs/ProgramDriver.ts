import { PublicKey } from '@solana/web3.js';
import { Cluster, GpaBuilder } from '@/shared';
import { MetaplexError, MissingGpaBuilderError } from '@/errors';
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

    if (!program.errorResolver) {
      return new UnknownProgramError(program, error as Error);
    }

    return program.errorResolver(error);
  }

  public getGpaBuilder<T extends GpaBuilder>(nameOrAddress: string | PublicKey): T {
    const program = this.get(nameOrAddress);

    if (!program.gpaResolver) {
      throw new MissingGpaBuilderError(program);
    }

    return program.gpaResolver(this.metaplex) as T;
  }
}
