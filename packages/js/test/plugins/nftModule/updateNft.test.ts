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
import { Keypair } from '@solana/web3.js';

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
  await mx
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
  const updatedNft = await mx.nfts().refresh(nft).run();
  spok(t, updatedNft, {
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
  } as unknown as Specifications<Nft>);
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
  await mx
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
  const updatedSft = await mx.nfts().refresh(sft).run();
  spok(t, updatedSft, {
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
  } as unknown as Specifications<Sft>);
});

test('[nftModule] it can update and verify creators at the same time', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And 4 creators.
  const creatorA = Keypair.generate();
  const creatorB = Keypair.generate();
  const creatorC = Keypair.generate();
  const creatorD = Keypair.generate();

  // And an existing NFT with:
  // - creatorA verified
  // - creatorB unverified
  // - creatorC unverified
  const nft = await createNft(mx, {
    creators: [
      {
        address: mx.identity().publicKey,
        share: 40,
      },
      {
        address: creatorA.publicKey,
        authority: creatorA,
        share: 30,
      },
      {
        address: creatorB.publicKey,
        share: 20,
      },
      {
        address: creatorC.publicKey,
        share: 10,
      },
    ],
  });
  t.ok(nft.creators[0].verified, 'update authority is verified');
  t.ok(nft.creators[1].verified, 'creatorA is verified');
  t.ok(!nft.creators[2].verified, 'creatorB is not verified');
  t.ok(!nft.creators[3].verified, 'creatorC is not verified');

  // When we update the NFT with such that:
  // - update authority was removed from the creators
  // - creatorA is still verified
  // - creatorB is still unverified
  // - creatorC is now verified
  // - creatorD is added and verified
  await mx
    .nfts()
    .update(nft, {
      creators: [
        {
          address: creatorA.publicKey,
          share: 30,
        },
        {
          address: creatorB.publicKey,
          share: 20,
        },
        {
          address: creatorC.publicKey,
          authority: creatorC,
          share: 10,
        },
        {
          address: creatorD.publicKey,
          authority: creatorD,
          share: 40,
        },
      ],
    })
    .run();

  // Then the returned NFT should have the updated data.
  const updatedNft = await mx.nfts().refresh(nft).run();
  spok(t, updatedNft, {
    $topic: 'Updated Nft',
    model: 'nft',
    creators: [
      {
        address: creatorA.publicKey,
        verified: true,
        share: 30,
      },
      {
        address: creatorB.publicKey,
        verified: false,
        share: 20,
      },
      {
        address: creatorC.publicKey,
        verified: true,
        share: 10,
      },
      {
        address: creatorD.publicKey,
        verified: true,
        share: 40,
      },
    ],
  } as unknown as Specifications<Nft>);
});
