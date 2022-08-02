import { Nft } from '@/index';
import { UseMethod } from '@metaplex-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import {
  createNft,
  killStuckProcess,
  metaplex,
  spokSameBignum,
} from '../../helpers';

killStuckProcess();

test('[nftModule] it can approve a Use authority for a given Nft', async (t: Test) => {
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
    .approveUseAuthority(nft, newUser.publicKey, {
      numberOfUses: 5,
    })
    .run();

  // Then that user can successfully use the NFT.
  await mx
    .nfts()
    .use(nft, {
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
