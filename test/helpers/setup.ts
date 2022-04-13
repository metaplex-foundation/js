import { Commitment, Connection, Keypair } from '@solana/web3.js';
import { LOCALHOST, airdrop } from '@metaplex-foundation/amman';
import {
  Metaplex,
  guestIdentity,
  keypairIdentity,
  mockStorage,
  UploadMetadataInput,
  CreateNftInput,
} from '@/index';

export interface MetaplexTestOptions {
  rpcEndpoint?: string;
  commitment?: Commitment;
  solsToAirdrop?: number;
}

export const metaplexGuest = (options: MetaplexTestOptions = {}) => {
  const connection = new Connection(options.rpcEndpoint ?? LOCALHOST, {
    commitment: options.commitment ?? 'singleGossip',
  });

  return Metaplex.make(connection).use(guestIdentity()).use(mockStorage());
};

export const metaplex = async (options: MetaplexTestOptions = {}) => {
  const wallet = Keypair.generate();
  const mx = metaplexGuest(options).use(keypairIdentity(wallet));
  await airdrop(mx.connection, wallet.publicKey, options.solsToAirdrop ?? 100);

  return mx;
};

export const createNft = async (
  mx: Metaplex,
  metadata: UploadMetadataInput = {},
  onChain: Partial<CreateNftInput> = {}
) => {
  const { uri } = await mx.nfts().uploadMetadata(metadata);
  const { nft } = await mx.nfts().createNft({ ...onChain, uri });

  return nft;
};
