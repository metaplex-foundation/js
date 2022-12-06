import { Connection } from '@solana/web3.js';
import { createMetaplex as baseCreateMetaplex } from '@metaplex-foundation/js-core';
import type { Metaplex, Cluster } from '@metaplex-foundation/js-core';
import { resolveClusterFromConnection } from '@/types';
import { corePlugins } from '@/plugins/corePlugins';

export type MetaplexOptions = {
  cluster?: Cluster;
};

export const createMetaplex = (
  connection: Connection,
  options: MetaplexOptions = {}
): Metaplex => {
  const metaplex = baseCreateMetaplex();
  metaplex.connection = connection;
  metaplex.cluster =
    options.cluster ?? resolveClusterFromConnection(connection);
  metaplex.use(corePlugins());

  return metaplex;
};

declare module '@metaplex-foundation/js-core/dist/types/Metaplex' {
  interface Metaplex {
    connection: Connection;
    cluster: Cluster;
  }
}
