import { PublicKey } from '@solana/web3.js';
import type { Metaplex as MetaplexType } from '@/Metaplex';
import { MissingGpaBuilderError, ProgramNotRecognizedError } from '@/errors';
import { Program, Cluster } from '@/types';
import { GpaBuilder } from '@/utils';

/**
 * @group Modules
 */
export class ProgramClient {
  protected programs: Program[] = [];
  constructor(protected readonly metaplex: MetaplexType) {}

  register(program: Program): void {
    this.programs.push(program);
  }

  all(): Program[] {
    return this.programs;
  }

  allForCluster(cluster: Cluster): Program[] {
    return this.programs.filter((program) => {
      return program.clusterFilter?.(cluster) ?? true;
    });
  }

  allForCurrentCluster(): Program[] {
    return this.allForCluster(this.metaplex.cluster);
  }

  get(nameOrAddress: string | PublicKey): Program {
    const programs = this.allForCurrentCluster();
    const program =
      typeof nameOrAddress === 'string'
        ? programs.find(({ name }) => name === nameOrAddress)
        : programs.find(({ address }) => address.equals(nameOrAddress));

    if (!program) {
      throw new ProgramNotRecognizedError(nameOrAddress, this.metaplex.cluster);
    }

    return program;
  }

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
