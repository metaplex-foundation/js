import { Commitment, Connection, Keypair } from '@solana/web3.js';
import {
  KeypairSigner,
  guestIdentity,
  mockStorage,
  keypairIdentity,
  programModule,
  operationModule,
  rpcModule,
  utilsModule,
  systemModule,
} from '@metaplex-foundation/js-core';
import { Metaplex } from '@/Metaplex';

import { LOCALHOST } from '@metaplex-foundation/amman-client';
import { amman } from './helpers';
import { tokenModule } from '../src/plugin';

export const metaplexGuest = (options: MetaplexTestOptions = {}) => {
  const connection = new Connection(options.rpcEndpoint ?? LOCALHOST, {
    commitment: options.commitment ?? 'confirmed',
  });

  return (
    Metaplex.make(connection)
      .use(guestIdentity())
      .use(mockStorage())
      .use(rpcModule())
      .use(operationModule())
      .use(programModule())
      .use(utilsModule())

      // Default drivers.
      .use(guestIdentity())

      // Verticals.
      .use(systemModule())
  );
};

export const metaplex = async (options: MetaplexTestOptions = {}) => {
  const mx = metaplexGuest(options);

  const wallet = await createWallet(mx, options.solsToAirdrop);

  return mx.use(keypairIdentity(wallet as Keypair));
};

export type MetaplexTestOptions = {
  rpcEndpoint?: string;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
  solsToAirdrop?: number;
};

export const createWallet = async (
  mx: Metaplex,
  solsToAirdrop: number = 100
): Promise<KeypairSigner> => {
  const wallet = Keypair.generate();
  await amman.airdrop(mx.connection, wallet.publicKey, solsToAirdrop);

  return wallet;
};
