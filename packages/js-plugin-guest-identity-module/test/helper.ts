import { Metaplex } from '@metaplex-foundation/js-core';
import { guestIdentity } from '../src/plugin';
import { mockStorage } from '../../js-plugin-mock-storage-module/src/plugin';
import {
  createWallet,
  MetaplexTestOptions,
} from '../../js-core/test/helpers/setup';
import { Connection, Keypair } from '@solana/web3.js';
import { LOCALHOST } from '@metaplex-foundation/amman-client';
import { keypairIdentity } from '../../js-plugin-keypair-identity-module/src/plugin';

export const metaplexGuest = (options: MetaplexTestOptions = {}) => {
  const connection = new Connection(options.rpcEndpoint ?? LOCALHOST, {
    commitment: options.commitment ?? 'confirmed',
  });

  return Metaplex.make(connection).use(guestIdentity()).use(mockStorage());
};

export const metaplex = async (options: MetaplexTestOptions = {}) => {
  const mx = metaplexGuest(options);
  const wallet = await createWallet(mx, options.solsToAirdrop);

  return mx.use(keypairIdentity(wallet as Keypair));
};
