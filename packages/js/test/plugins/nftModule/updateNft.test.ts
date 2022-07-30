import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { Nft, Sft, toMetaplexFile } from '@/index';
import {
  metaplex,
  createNft,
  killStuckProcess,
  createSft,
  spokSamePubkey,
} from '../../helpers';

killStuckProcess();

test('[nftModule] it can update the on-chain metadata of an NFT', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing NFT.
  const nft = await createNft(mx, {
    name: 'On-chain NFT name',
    symbol: 'OLD',
    sellerFeeBasisPoints: 100,
    isMutable: true,
    json: {
      name: 'JSON NFT name',
      description: 'JSON NFT description',
      image: toMetaplexFile('some image', 'some-image.jpg'),
    },
  });

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
  const { nftOrSft: updatedNft } = await mx
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
    token: {
      address: spokSamePubkey(nft.token.address),
    },
  } as unknown as Specifications<Nft>;
  spok(t, updatedNft, expectedNft);

  // And the same goes if we try to fetch the NFT again.
  const fetchedUpdatedNft = await mx
    .nfts()
    .findByMint(nft.address, { tokenAddress: nft.token.address })
    .run();
  spok(t, fetchedUpdatedNft, expectedNft);
});

test('[nftModule] it can update the on-chain metadata of an SFT', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing SFT.
  const sft = await createSft(mx, {
    name: 'On-chain SFT name',
    symbol: 'OLD',
    sellerFeeBasisPoints: 100,
    isMutable: true,
    json: {
      name: 'JSON SFT name',
      description: 'JSON SFT description',
      image: toMetaplexFile('some image', 'some-image.jpg'),
    },
  });

  // And some new updated metadata that has been uploadeds.
  const { uri: updatedUri, metadata: updatedMetadata } = await mx
    .nfts()
    .uploadMetadata({
      name: 'Updated JSON SFT name',
      description: 'Updated JSON SFT description',
      image: toMetaplexFile('updated image', 'updated-image.jpg'),
    })
    .run();

  // When we update the NFT with new on-chain data.
  const { nftOrSft: updatedSft } = await mx
    .nfts()
    .update(sft, {
      name: 'Updated On-chain SFT name',
      symbol: 'UPDATED',
      sellerFeeBasisPoints: 500,
      primarySaleHappened: true,
      uri: updatedUri,
      isMutable: false,
    })
    .run();

  // Then the returned NFT should have the updated data.
  const expectedSft = {
    $topic: 'Updated SFT',
    model: 'sft',
    name: 'Updated On-chain SFT name',
    symbol: 'UPDATED',
    sellerFeeBasisPoints: 500,
    uri: updatedUri,
    isMutable: false,
    primarySaleHappened: true,
    json: {
      name: 'Updated JSON SFT name',
      description: 'Updated JSON SFT description',
      image: updatedMetadata.image,
    },
  } as unknown as Specifications<Sft>;
  spok(t, updatedSft, expectedSft);

  // And the same goes if we try to fetch the NFT again.
  const fetchedUpdatedSft = await mx.nfts().findByMint(sft.address).run();
  spok(t, fetchedUpdatedSft, expectedSft);
});
