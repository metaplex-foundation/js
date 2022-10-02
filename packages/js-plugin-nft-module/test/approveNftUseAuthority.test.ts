import { Nft } from '@/index';
import { UseMethod } from '@metaplex-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import {
  assertThrows,
  createNft,
  killStuckProcess,
  metaplex,
  spokSameBignum,
} from '../../helpers';

killStuckProcess();

test('[nftModule] it can approve a use authority for a given Nft', async (t: Test) => {
  // Given we have a Metaplex instance and a usable NFT.
  const mx = await metaplex();
  const nft = await createNft(mx, {
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: 10,
      total: 10,
    },
  });

  // When we approve a new use authority.
  const newUser = Keypair.generate();
  await mx
    .nfts()
    .approveUseAuthority({
      mintAddress: nft.address,
      user: newUser.publicKey,
      numberOfUses: 5,
    })
    .run();

  // Then that user can successfully use the NFT.
  await mx
    .nfts()
    .use({
      mintAddress: nft.address,
      numberOfUses: 5,
      useAuthority: newUser,
    })
    .run();

  // And the returned NFT should have the updated data.
  const updatedNft = await mx.nfts().refresh(nft).run();
  spok(t, updatedNft, {
    $topic: 'Updated Nft',
    model: 'nft',
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: spokSameBignum(5),
      total: spokSameBignum(10),
    },
  } as unknown as Specifications<Nft>);
});

test('[nftModule] approve use authorities cannot use more than the agreed amount', async (t: Test) => {
  // Given we have a Metaplex instance and a usable NFT with 10 remaining uses.
  const mx = await metaplex();
  const nft = await createNft(mx, {
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: 10,
      total: 10,
    },
  });

  // And a use authority has been approved for 5 uses only.
  const currentUser = Keypair.generate();
  await mx
    .nfts()
    .approveUseAuthority({
      mintAddress: nft.address,
      user: currentUser.publicKey,
      numberOfUses: 5,
    })
    .run();

  // When we try to use that authority for 6 uses.
  const promise = mx
    .nfts()
    .use({
      mintAddress: nft.address,
      useAuthority: currentUser,
      numberOfUses: 6,
    })
    .run();

  // Then we should get an error.
  await assertThrows(
    t,
    promise,
    /There are not enough Uses left on this token/
  );
});
