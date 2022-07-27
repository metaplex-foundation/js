import test, { Test } from 'tape';
import spok from 'spok';
import { toLazyMetadata, toLazyNft, toMetadataAccount } from '@/plugins';
import {
  metaplex,
  createNft,
  killStuckProcess,
  spokSamePubkey,
} from '../../helpers';

killStuckProcess();

test('[nftModule] it can load a lazy NFT', async (t: Test) => {
  // Given a metaplex instance and a lazy NFT.
  const mx = await metaplex();
  const originalNft = await createNft(
    mx,
    { name: 'Json Name' },
    { name: 'On-chain Name' }
  );
  const metadataAccount = toMetadataAccount(
    await mx.rpc().getAccount(originalNft.metadataAddress)
  );
  const lazyNft = toLazyNft(toLazyMetadata(metadataAccount));

  // When we load that lazy NFT.
  const nft = await mx.nfts().loadNft(lazyNft).run();

  // Then we get the fully loaded version of that NFT.
  spok(t, nft, {
    $topic: 'Loaded NFT',
    model: 'nft',
    lazy: false,
    metadataAddress: spokSamePubkey(lazyNft.metadataAddress),
    name: 'On-chain Name',
    json: {
      name: 'Json Name',
    },
    mint: {
      address: spokSamePubkey(lazyNft.mintAddress),
    },
    edition: {
      isOriginal: true,
    },
  });
});
