import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { Nft, MetaplexFile, JsonMetadata } from '@/index';
import { metaplex } from '../../helpers';
// import { Keypair } from '@solana/web3.js';

test('it can create and update the nft', async (t: Test) => {
  // Given we have a Metaplex instance.

  const mx = await metaplex();
  const imageFile = new MetaplexFile('some_image', 'some-image.jpg');
  const imageUri = await mx.storage().upload(imageFile);

  // And we uploaded some metadata containing this image.
  const metadataUri = await mx.storage().uploadJson<JsonMetadata>({
    name: 'JSON NFT name',
    description: 'JSON NFT description',
    image: imageUri,
  });


  const { nft: createdNft } = await mx.nfts().createNft({
    uri: metadataUri,
    name: 'On-chain NFT name',
    isMutable: true,
  });

  const updatedImageFile = new MetaplexFile('updated_image', 'updated-image.jpg');
  const updatedImageUri: string = await mx.storage().upload(updatedImageFile);
  const updatedMetadataUri: string = await mx.storage().uploadJson<JsonMetadata>({
    name: 'Updated JSON NFT name',
    description: 'Updated JSON NFT description',
    image: updatedImageUri,
  });

  const { nft: updated_nft }: { nft: Nft } = await mx.nfts().updateNft(createdNft, {
    name: 'Updated On-chain NFT name',
    primarySaleHappened: true,
    uri: updatedMetadataUri,
    isMutable: false,
  });
  spok(t, updated_nft, {
    $topic: 'update-nft',
    name: 'Updated On-chain NFT name',
    uri: updatedMetadataUri,
    metadata: {
      name: 'Updated JSON NFT name',
      description: 'Updated JSON NFT description',
      image: updatedImageUri,
    },
    primarySaleHappened: true,
  } as unknown as Specifications<Nft>);

  const foundUpdatedNft = await mx.nfts().findNftByMint(createdNft.mint);
  spok(t, foundUpdatedNft, {
    $topic: 'check-downloaded-nft',
    name: 'Updated On-chain NFT name',
    uri: updatedMetadataUri,
    metadata: {
      name: 'Updated JSON NFT name',
      description: 'Updated JSON NFT description',
      image: updatedImageUri,
    },
    primarySaleHappened: true,
  } as unknown as Specifications<Nft>);
});
