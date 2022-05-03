import { ProgramNotRecognizedError } from '@/errors';
import { Cluster } from '@/shared';
import { PublicKey } from '@solana/web3.js';
import { Program } from './Program';
import { ProgramDriver } from './ProgramDriver';

export class ArrayProgramDriver extends ProgramDriver {
  protected programs: Program[] = [];

  public register(program: Program): void {
    this.programs.push(program);
  }

  public all(): Program[] {
    return this.programs;
  }

  public allForCluster(cluster: Cluster): Program[] {
    return this.programs.filter((program) => program.clusterFilter(cluster));
  }

  public allForCurrentCluster(): Program[] {
    return this.allForCluster(this.metaplex.cluster);
  }

  public get(nameOrAddress: string | PublicKey): Program {
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
