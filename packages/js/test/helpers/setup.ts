import { Commitment, Connection, Keypair } from '@solana/web3.js';
import { LOCALHOST } from '@metaplex-foundation/amman-client';
import {
  Metaplex,
  guestIdentity,
  keypairIdentity,
  mockStorage,
  UploadMetadataInput,
  CreateNftInput,
  KeypairSigner,
} from '@/index';
import { amman } from './amman';

export interface MetaplexTestOptions {
  rpcEndpoint?: string;
  commitment?: Commitment;
  solsToAirdrop?: number;
}

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

export const createWallet = async (
  mx: Metaplex,
  solsToAirdrop: number = 100
): Promise<KeypairSigner> => {
  const wallet = Keypair.generate();
  await amman.airdrop(mx.connection, wallet.publicKey, solsToAirdrop);

  return wallet;
};

export const createNft = async (
  mx: Metaplex,
  metadata: UploadMetadataInput = {},
  onChain: Partial<CreateNftInput> = {}
) => {
  const { uri } = await mx.nfts().uploadMetadata(metadata).run();
  const { nft } = await mx
    .nfts()
    .create({
      uri,
      name: 'My NFT',
      sellerFeeBasisPoints: 200,
      ...onChain,
    })
    .run();

  return nft;
};
