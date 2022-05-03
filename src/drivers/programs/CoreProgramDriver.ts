import { Cluster } from '@/shared';
import { PublicKey } from '@solana/web3.js';
import { Program } from './Program';
import { ProgramDriver } from './ProgramDriver';

export class CoreProgramDriver extends ProgramDriver {
  protected programs: Program[] = [];

  public register(program: Program): void {
    this.programs.push(program);
  }

  public all(): Program[] {
    return this.programs;
  }

  public allForCluster(cluster: Cluster): Program[] {
    return this.programs.filter((program) => program.clusterResolver(cluster));
  }

  public allForCurrentCluster(): Program[] {
    return this.allForCluster(this.metaplex.cluster);
  }

  public get(nameOrAddress: string | PublicKey): Program | null {
    const programs = this.allForCurrentCluster();

    if (typeof nameOrAddress === 'string') {
      return programs.find((program) => program.name === nameOrAddress) ?? null;
    }

    return programs.find((program) => program.address.equals(nameOrAddress)) ?? null;
  }
}
