import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { Nft, MetaplexFile } from '@/index';
import { metaplex, createNft } from '../../helpers';

test('it can update the on-chain data of an nft', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing NFT.
  const nft = await createNft(mx, {
    name: 'JSON NFT name',
    description: 'JSON NFT description',
    image: new MetaplexFile('some image', 'some-image.jpg'),
  }, {
    name: 'On-chain NFT name',
    isMutable: true,
  });

  // And some new updated metadata that has been uploadeds.
  const { uri: updatedUri, metadata: updatedMetadata } = await mx.nfts().uploadMetadata({
    name: 'Updated JSON NFT name',
    description: 'Updated JSON NFT description',
    image: new MetaplexFile('updated image', 'updated-image.jpg'),
  });

  // When we update the NFT with new on-chain data.
  const { nft: updatedNft } = await mx.nfts().updateNft(nft, {
    name: 'Updated On-chain NFT name',
    primarySaleHappened: true,
    uri: updatedUri,
    isMutable: false,
  });

  // Then the returned NFT should have the updated data.
  spok(t, updatedNft, {
    $topic: 'update-nft',
    name: 'Updated On-chain NFT name',
    uri: updatedUri,
    metadata: {
      name: 'Updated JSON NFT name',
      description: 'Updated JSON NFT description',
      image: updatedMetadata.image,
    },
    primarySaleHappened: true,
  } as unknown as Specifications<Nft>);

  // And the same goes if we try to fetch the NFT again.
  const foundUpdatedNft = await mx.nfts().findNftByMint(nft.mint);
  spok(t, foundUpdatedNft, {
    $topic: 'check-downloaded-nft',
    name: 'Updated On-chain NFT name',
    uri: updatedUri,
    metadata: {
      name: 'Updated JSON NFT name',
      description: 'Updated JSON NFT description',
      image: updatedMetadata.image,
    },
    primarySaleHappened: true,
  } as unknown as Specifications<Nft>);
});
