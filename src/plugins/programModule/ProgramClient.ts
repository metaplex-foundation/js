import { PublicKey } from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import { ProgramNotRecognizedError } from '@/errors';
import { Program, Cluster } from '@/types';

export class ProgramClient {
  constructor(protected readonly metaplex: Metaplex) {}

  protected programs: Program[] = [];

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
        ? programs.find((program) => program.name === nameOrAddress)
        : programs.find((program) => program.address.equals(nameOrAddress));

    if (!program) {
      throw new ProgramNotRecognizedError(nameOrAddress, this.metaplex.cluster);
    }

    return program;
  }
}
