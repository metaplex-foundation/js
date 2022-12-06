import { Connection } from '@solana/web3.js';
import { createMetaplex as baseCreateMetaplex } from '@metaplex-foundation/js-core';
import type { Metaplex } from '@metaplex-foundation/js-core';
import { Cluster, resolveClusterFromConnection } from '@/types';
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
