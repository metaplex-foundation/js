import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { MetaplexError, Nft, useMetaplexFile } from '@/index';
import { UseMethod } from '@metaplex-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
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
        useMethod: UseMethod.Multiple,
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

  // When we use the NFT "n" times.
  const { nft: usedNft } = await mx
    .nfts()
    .use(nft, { numberOfUses: timesToUse });

  // Then the returned NFT should have "n" less uses.
  spok(t, usedNft, {
    $topic: 'use-nft',
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: spokSameBignum(totalUses - timesToUse),
      total: spokSameBignum(totalUses),
    },
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
  } as unknown as Specifications<Nft>);
});

test('it only allows the owner to update the uses', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing SFT owned by owner.
  const owner = Keypair.generate().publicKey;

  const nft = await createNft(
    mx,
    {
      name: 'JSON SFT name',
      description: 'JSON SFT description',
      image: useMetaplexFile('some image', 'some-image.jpg'),
    },
    {
      name: 'On-chain SFT name',
      owner,
      isMutable: true,
      uses: {
        useMethod: UseMethod.Multiple,
        remaining: 10,
        total: 10,
      },
    }
  );

  // When the wrong owner uses the NFT
  try {
    await mx.nfts().use(nft);
  } catch (error) {
    // Then we should get a MetaplexError.
    t.equal(error instanceof MetaplexError, true);
  }
});

test('it can only be used up to the total uses', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing SFT with no remaining uses.
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
        useMethod: UseMethod.Multiple,
        remaining: 1,
        total: 10,
      },
    }
  );

  // It throws an error when there are no remaining uses.
  try {
    await mx.nfts().use(nft, { numberOfUses: 2 });
  } catch (error) {
    t.match((error as MetaplexError).problem, /not enough uses/i);
  }
});

test;
