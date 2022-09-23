import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { Nft, Sft, token } from '@/index';
import { UseMethod } from '@metaplex-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
import {
  metaplex,
  createNft,
  killStuckProcess,
  spokSameBignum,
  assertThrows,
  createSft,
} from '../../helpers';

killStuckProcess();

test('[nftModule] it can use an NFT', async (t: Test) => {
  // Given an existing NFT with 10 uses.
  const mx = await metaplex();
  const nft = await createNft(mx, {
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: 10,
      total: 10,
    },
  });

  // When we use the NFT once.
  await mx.nfts().use({ mintAddress: nft.address }).run();
  const usedNft = await mx.nfts().refresh(nft).run();

  // Then the returned usable NFT should have one less use.
  spok(t, usedNft, {
    model: 'nft',
    $topic: 'Used NFT',
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: spokSameBignum(9),
      total: spokSameBignum(10),
    },
  } as unknown as Specifications<Nft>);
});

test('[nftModule] it can use an SFT', async (t: Test) => {
  // Given an existing SFT with 10 uses.
  const mx = await metaplex();
  const sft = await createSft(mx, {
    tokenOwner: mx.identity().publicKey,
    tokenAmount: token(10),
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: 10,
      total: 10,
    },
  });

  // When we use the NFT once.
  await mx.nfts().use({ mintAddress: sft.address }).run();
  const usedSft = await mx.nfts().refresh(sft).run();

  // Then the returned usable NFT should have one less use.
  spok(t, usedSft, {
    $topic: 'Used SFT',
    model: 'sft',
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: spokSameBignum(9),
      total: spokSameBignum(10),
    },
  } as unknown as Specifications<Sft>);
});

test('[nftModule] it can use an NFT multiple times', async (t: Test) => {
  // Given an existing NFT with 7 remaining uses.
  const mx = await metaplex();
  const nft = await createNft(mx, {
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: 7,
      total: 10,
    },
  });

  // When we use the NFT 3 times.
  await mx.nfts().use({ mintAddress: nft.address, numberOfUses: 3 }).run();
  const usedNft = await mx.nfts().refresh(nft).run();

  // Then the returned NFT should have 4 remaining uses.
  spok(t, usedNft, {
    $topic: 'Used NFT',
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: spokSameBignum(4),
      total: spokSameBignum(10),
    },
  } as unknown as Specifications<Nft>);
});

test('[nftModule] it only allows the owner to update the uses', async (t: Test) => {
  // Given an existing NFT with 10 remaining uses.
  const mx = await metaplex();
  const nft = await createNft(mx, {
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: 10,
      total: 10,
    },
  });

  // And an another wallet that do not own that NFT.
  const anotherWallet = Keypair.generate();

  // When this other wallet tries to use that NFT.
  const promise = mx
    .nfts()
    .use({ mintAddress: nft.address, owner: anotherWallet })
    .run();

  // Then we get an error.
  await assertThrows(t, promise, /invalid account data for instruction/);
});

test('[nftModule] it cannot be used more times than the remaining uses', async (t: Test) => {
  // Given an existing NFT with 2 remaining uses.
  const mx = await metaplex();
  const nft = await createNft(mx, {
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: 2,
      total: 10,
    },
  });

  // When this other wallet tries to use that NFT.
  const promise = mx
    .nfts()
    .use({ mintAddress: nft.address, numberOfUses: 3 })
    .run();

  // Then we get an error.
  await assertThrows(
    t,
    promise,
    /There are not enough Uses left on this token/
  );
});
