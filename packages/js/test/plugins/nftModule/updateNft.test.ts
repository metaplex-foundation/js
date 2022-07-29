import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { Nft, toMetaplexFile } from '@/index';
import { metaplex, createNft, killStuckProcess } from '../../helpers';

killStuckProcess();

test('[nftModule] it can update the on-chain metadata of an NFT', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing NFT.
  const nft = await createNft(
    mx,
    {
      name: 'JSON NFT name',
      description: 'JSON NFT description',
      image: toMetaplexFile('some image', 'some-image.jpg'),
    },
    {
      name: 'On-chain NFT name',
      symbol: 'OLD',
      sellerFeeBasisPoints: 100,
      isMutable: true,
    }
  );

  // And some new updated metadata that has been uploadeds.
  const { uri: updatedUri, metadata: updatedMetadata } = await mx
    .nfts()
    .uploadMetadata({
      name: 'Updated JSON NFT name',
      description: 'Updated JSON NFT description',
      image: toMetaplexFile('updated image', 'updated-image.jpg'),
    })
    .run();

  // When we update the NFT with new on-chain data.
  const { nft: updatedNft } = await mx
    .nfts()
    .update(nft, {
      name: 'Updated On-chain NFT name',
      symbol: 'UPDATED',
      sellerFeeBasisPoints: 500,
      primarySaleHappened: true,
      uri: updatedUri,
      isMutable: false,
    })
    .run();

  // Then the returned NFT should have the updated data.
  const expectedNft = {
    $topic: 'Updated Nft',
    model: 'nft',
    name: 'Updated On-chain NFT name',
    symbol: 'UPDATED',
    sellerFeeBasisPoints: 500,
    uri: updatedUri,
    isMutable: false,
    primarySaleHappened: true,
    json: {
      name: 'Updated JSON NFT name',
      description: 'Updated JSON NFT description',
      image: updatedMetadata.image,
    },
  } as unknown as Specifications<Nft>;
  spok(t, updatedNft, expectedNft);

  // And the same goes if we try to fetch the NFT again.
  const fetchedUpdatedNft = await mx.nfts().findByMint(nft.address).run();
  spok(t, fetchedUpdatedNft, expectedNft);
});
