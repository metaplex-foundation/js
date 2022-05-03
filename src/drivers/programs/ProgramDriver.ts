import { Cluster } from '@/shared';
import { PublicKey } from '@solana/web3.js';
import { Driver } from '../Driver';
import { Program } from './Program';

export abstract class ProgramDriver extends Driver {
  public abstract register(program: Program): void;
  public abstract all(): Program[];
  public abstract allForCluster(cluster: Cluster): Program[];
  public abstract allForCurrentCluster(): Program[];
  public abstract get(nameOrAddress: string | PublicKey): Program;
}
