import test, { Test } from 'tape';
import spok from 'spok';
import { toMetadata, toMetadataAccount } from '@/index';
import {
  metaplex,
  createNft,
  killStuckProcess,
  spokSamePubkey,
} from '../../helpers';

killStuckProcess();

test('[nftModule] it can load a Metadata model', async (t: Test) => {
  // Given a metaplex instance and a Metadata model.
  const mx = await metaplex();
  const originalNft = await createNft(mx, {
    name: 'On-chain Name',
    json: { name: 'Json Name' },
  });
  const metadataAccount = toMetadataAccount(
    await mx.rpc().getAccount(originalNft.metadataAddress)
  );
  const metadata = toMetadata(metadataAccount);

  // When we load that Metadata model.
  const nft = await mx.nfts().load(metadata).run();

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
