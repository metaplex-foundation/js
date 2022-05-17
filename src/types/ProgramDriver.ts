import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@/types';
import { GpaBuilder } from '@/utils';
import { MissingGpaBuilderError } from '@/errors';
import { Driver } from './Driver';
import { Program } from './Program';

export abstract class ProgramDriver extends Driver {
  public abstract register(program: Program): void;
  public abstract all(): Program[];
  public abstract allForCluster(cluster: Cluster): Program[];
  public abstract allForCurrentCluster(): Program[];
  public abstract get(nameOrAddress: string | PublicKey): Program;

  public getGpaBuilder<T extends GpaBuilder>(
    nameOrAddress: string | PublicKey
  ): T {
    const program = this.get(nameOrAddress);

    if (!program.gpaResolver) {
      throw new MissingGpaBuilderError(program);
    }

    return program.gpaResolver(this.metaplex) as T;
  }
}
