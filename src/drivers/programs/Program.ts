import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@/shared';

export type Program = {
  name: string;
  address: PublicKey;
  clusterFilter: (cluster: Cluster) => boolean;
};
