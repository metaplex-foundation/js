import { UseMethod } from '@metaplex-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import {
  assertThrows,
  createNft,
  killStuckProcess,
  metaplex,
} from '../../helpers';

killStuckProcess();

test('[nftModule] it can revoke a Use authority for a given Nft', async (t: Test) => {
  // Given we have a Metaplex instance and a usable NFT.
  const mx = await metaplex();
  const nft = await createNft(mx, {
    uses: {
      useMethod: UseMethod.Multiple,
      remaining: 10,
      total: 10,
    },
  });

  // And a use authority has been approved.
  const currentUser = Keypair.generate();
  await mx
    .nfts()
    .approveUseAuthority({
      mintAddress: nft.address,
      user: currentUser.publicKey,
    })
    .run();

  // When we revoke that use authority.
  await mx
    .nfts()
    .revokeUseAuthority({
      mintAddress: nft.address,
      user: currentUser.publicKey,
    })
    .run();

  // Then it can no longer use that NFT.
  const promise = mx
    .nfts()
    .use({ mintAddress: nft.address, useAuthority: currentUser })
    .run();

  await assertThrows(
    t,
    promise,
    /The Use Authority Record is empty or already revoked/
  );
});
