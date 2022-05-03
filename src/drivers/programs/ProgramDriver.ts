import { PublicKey } from '@solana/web3.js';
import { Cluster, GpaBuilder } from '@/shared';
import { MetaplexError } from '@/errors';
import { Driver } from '../Driver';
import { Program } from './Program';

export abstract class ProgramDriver extends Driver {
  public abstract register(program: Program): void;
  public abstract all(): Program[];
  public abstract allForCluster(cluster: Cluster): Program[];
  public abstract allForCurrentCluster(): Program[];
  public abstract get(nameOrAddress: string | PublicKey): Program;

  public resolveError<T extends MetaplexError>(
    nameOrAddress: string | PublicKey,
    error: unknown
  ): T {
    return this.get(nameOrAddress).errorResolver(error);
  }

  public getGpaBuilder<T extends GpaBuilder>(nameOrAddress: string | PublicKey): T {
    return this.get(nameOrAddress).gpaResolver<T>(this.metaplex);
  }
}
