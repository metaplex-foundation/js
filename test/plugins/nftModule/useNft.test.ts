import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { Nft, useMetaplexFile } from '@/index';
import { UseMethod } from '@metaplex-foundation/mpl-token-metadata';
import {
  metaplex,
  createNft,
  killStuckProcess,
  spokSameBignum,
} from '../../helpers';

killStuckProcess();

test('it can use an nft', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing SFT.
  const nft = await createNft(
    mx,
    {
      name: 'JSON SFT name',
      description: 'JSON SFT description',
      image: useMetaplexFile('some image', 'some-image.jpg'),
    },
    {
      name: 'On-chain SFT name',
      isMutable: true,
      uses: {
        useMethod: 1,
        remaining: 10,
        total: 10,
      },
    }
  );

  // When we use the NFT once.
  const { nft: usedNft } = await mx.nfts().use(nft);

  // Then the returned SFT should have one less use.
  spok(t, usedNft, {
    $topic: 'use-nft',
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: spokSameBignum(9),
      total: spokSameBignum(10),
    },
    primarySaleHappened: true,
  } as unknown as Specifications<Nft>);

  // And the same goes if we try to fetch the NFT again.
  const foundUpdatedNft = await mx.nfts().findByMint(nft.mint);
  spok(t, foundUpdatedNft, {
    $topic: 'check-downloaded-nft',
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: spokSameBignum(9),
      total: spokSameBignum(10),
    },
    primarySaleHappened: true,
  } as unknown as Specifications<Nft>);
});

test('it can use an nft multiple times', async (t: Test) => {
  const totalUses = 10;
  const timesToUse = 3;
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing SFT.
  const nft = await createNft(
    mx,
    {
      name: 'JSON SFT name',
      description: 'JSON SFT description',
      image: useMetaplexFile('some image', 'some-image.jpg'),
    },
    {
      name: 'On-chain SFT name',
      isMutable: true,
      uses: {
        useMethod: 1,
        remaining: totalUses,
        total: totalUses,
      },
    }
  );

  // When we use the NFT once.
  const { nft: usedNft } = await mx.nfts().use(nft, timesToUse);

  // Then the returned SFT should have one n less uses.
  spok(t, usedNft, {
    $topic: 'use-nft',
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: spokSameBignum(totalUses - timesToUse),
      total: spokSameBignum(totalUses),
    },
    primarySaleHappened: true,
  } as unknown as Specifications<Nft>);

  // And the same goes if we try to fetch the NFT again.
  const foundUsedNft = await mx.nfts().findByMint(nft.mint);
  spok(t, foundUsedNft, {
    $topic: 'check-downloaded-nft',
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: spokSameBignum(totalUses - timesToUse),
      total: spokSameBignum(totalUses),
    },
    primarySaleHappened: true,
  } as unknown as Specifications<Nft>);
});
