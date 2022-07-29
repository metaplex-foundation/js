import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { Nft } from '@/index';
import { UseMethod } from '@metaplex-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
import {
  metaplex,
  createNft,
  killStuckProcess,
  spokSameBignum,
  assertThrows,
} from '../../helpers';

killStuckProcess();

test('[nftModule] it can use an nft', async (t: Test) => {
  // Given an existing NFT with 10 uses.
  const mx = await metaplex();
  const uses = {
    useMethod: UseMethod.Multiple,
    remaining: 10,
    total: 10,
  };
  const nft = await createNft(mx, { uses });

  // When we use the NFT once.
  const { nft: usedNft } = await mx.nfts().use(nft).run();

  // Then the returned usable NFT should have one less use.
  spok(t, usedNft, {
    $topic: 'Used NFT',
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: spokSameBignum(9),
      total: spokSameBignum(10),
    },
  } as unknown as Specifications<Nft>);
});

test('[nftModule] it can use an nft multiple times', async (t: Test) => {
  // Given an existing NFT with 7 remaining uses.
  const mx = await metaplex();
  const uses = {
    useMethod: UseMethod.Multiple,
    remaining: 7,
    total: 10,
  };
  const nft = await createNft(mx, { uses });

  // When we use the NFT 3 times.
  const { nft: usedNft } = await mx.nfts().use(nft, { numberOfUses: 3 }).run();

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
  const uses = {
    useMethod: UseMethod.Multiple,
    remaining: 10,
    total: 10,
  };
  const nft = await createNft(mx, { uses });

  // And an another wallet that do not own that NFT.
  const anotherWallet = Keypair.generate();

  // When this other wallet tries to use that NFT.
  const promise = mx.nfts().use(nft, { owner: anotherWallet.publicKey }).run();

  // Then we get an error.
  await assertThrows(t, promise, /invalid account data for instruction/);
});

test('[nftModule] it cannot be used more times than the remaining uses', async (t: Test) => {
  // Given an existing NFT with 2 remaining uses.
  const mx = await metaplex();
  const uses = {
    useMethod: UseMethod.Multiple,
    remaining: 2,
    total: 10,
  };
  const nft = await createNft(mx, { uses });

  // When this other wallet tries to use that NFT.
  const promise = mx.nfts().use(nft, { numberOfUses: 3 }).run();

  // Then we get an error.
  await assertThrows(
    t,
    promise,
    /There are not enough Uses left on this token/
  );
});
