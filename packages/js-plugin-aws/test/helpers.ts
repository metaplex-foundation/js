import { Commitment, Keypair } from '@solana/web3.js';
import { Amman } from '@metaplex-foundation/amman-client';
import test from 'tape';
import { createMetaplex, Metaplex } from '@metaplex-foundation/js-core';
import {
  guestIdentity,
  keypairIdentity,
  mockStorage,
  KeypairSigner,
  logDebug,
} from '@metaplex-foundation/js';

export const amman = Amman.instance({ log: logDebug });

export type MetaplexTestOptions = {
  rpcEndpoint?: string;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
  solsToAirdrop?: number;
};

export const metaplexGuest = (): Metaplex => {
  return createMetaplex().use(guestIdentity()).use(mockStorage());
};

export const metaplex = async (
  options: MetaplexTestOptions = {}
): Promise<Metaplex> => {
  const mx = metaplexGuest();
  const wallet = await createWallet(mx, options.solsToAirdrop);

  return mx.use(keypairIdentity(wallet as Keypair));
};

export const createWallet = async (
  mx: Metaplex,
  solsToAirdrop = 100
): Promise<KeypairSigner> => {
  const wallet = Keypair.generate();
  await amman.airdrop(mx.connection, wallet.publicKey, solsToAirdrop);

  return wallet;
};

/**
 * This is a workaround the fact that web3.js doesn't close it's socket connection and provides no way to do so.
 * Therefore the process hangs for a considerable time after the tests finish, increasing the feedback loop.
 *
 * This fixes this by exiting the process as soon as all tests are finished.
 */
export function killStuckProcess() {
  // Don't do this in CI since we need to ensure we get a non-zero exit code if tests fail
  if (process.env.CI == null) {
    test.onFinish(() => process.exit(0));
  }
}
