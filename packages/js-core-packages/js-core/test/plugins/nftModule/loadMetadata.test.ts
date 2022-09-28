import test, { Test } from 'tape';
import spok from 'spok';
import {
  Metadata,
  Metaplex,
  Nft,
  Sft,
  toMetadata,
  toMetadataAccount,
} from '@/index';
import {
  metaplex,
  createNft,
  killStuckProcess,
  spokSamePubkey,
  createSft,
} from '../../helpers';

killStuckProcess();

test('[nftModule] it can load a Metadata model into an NFT', async (t: Test) => {
  // Given a metaplex instance and a Metadata model.
  const mx = await metaplex();
  const originalNft = await createNft(mx, {
    name: 'On-chain Name',
    json: { name: 'Json Name' },
  });
  const metadata = await asMetadata(mx, originalNft);

  // When we load that Metadata model.
  const nft = await mx.nfts().load({ metadata }).run();

  // Then we get the fully loaded NFT model.
  spok(t, nft, {
    $topic: 'Loaded NFT',
    model: 'nft',
    address: spokSamePubkey(metadata.mintAddress),
    metadataAddress: spokSamePubkey(metadata.address),
    name: 'On-chain Name',
    json: {
      name: 'Json Name',
    },
    mint: {
      address: spokSamePubkey(metadata.mintAddress),
    },
    edition: {
      isOriginal: true,
    },
  });
});

test('[nftModule] it can load a Metadata model into an SFT', async (t: Test) => {
  // Given a metaplex instance and a Metadata model.
  const mx = await metaplex();
  const originalSft = await createSft(mx, {
    name: 'On-chain Name',
    json: { name: 'Json Name' },
  });
  const metadata = await asMetadata(mx, originalSft);

  // When we load that Metadata model.
  const sft = await mx.nfts().load({ metadata }).run();

  // Then we get the fully loaded SFT model.
  spok(t, sft, {
    $topic: 'Loaded SFT',
    model: 'sft',
    address: spokSamePubkey(metadata.mintAddress),
    metadataAddress: spokSamePubkey(metadata.address),
    name: 'On-chain Name',
    json: {
      name: 'Json Name',
    },
    mint: {
      address: spokSamePubkey(metadata.mintAddress),
    },
  });
});

test('[nftModule] it can load a Metadata model into an NftWithToken', async (t: Test) => {
  // Given a metaplex instance and a Metadata model.
  const mx = await metaplex();
  const originalNft = await createNft(mx, {
    name: 'On-chain Name',
    json: { name: 'Json Name' },
  });
  const metadata = await asMetadata(mx, originalNft);

  // When we load that Metadata model and provide the token address
  const nft = await mx
    .nfts()
    .load({ metadata, tokenAddress: originalNft.token.address })
    .run();

  // Then we get the fully loaded NFT model with Token information.
  spok(t, nft, {
    $topic: 'Loaded NFT',
    model: 'nft',
    address: spokSamePubkey(metadata.mintAddress),
    metadataAddress: spokSamePubkey(metadata.address),
    name: 'On-chain Name',
    json: {
      name: 'Json Name',
    },
    mint: {
      address: spokSamePubkey(metadata.mintAddress),
    },
    token: {
      address: spokSamePubkey(originalNft.token.address),
    },
    edition: {
      isOriginal: true,
    },
  });
});

const asMetadata = async (
  mx: Metaplex,
  nftOrSft: Nft | Sft
): Promise<Metadata> => {
  const metadataAccount = toMetadataAccount(
    await mx.rpc().getAccount(nftOrSft.metadataAddress)
  );

  return toMetadata(metadataAccount);
};
