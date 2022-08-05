import { NftWithToken } from '@/index';
import { AccountState } from '@solana/spl-token';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import {
  assertThrows,
  createNft,
  killStuckProcess,
  metaplex,
} from '../../helpers';

killStuckProcess();

test('[nftModule] a delegated authority can freeze its NFT', async (t: Test) => {
  // Given an existing delegated NFT.
  const mx = await metaplex();
  const delegateAuthority = Keypair.generate();
  const nft = await createNft(mx);
  await mx
    .nfts()
    .approveDelegateAuthority(nft, {
      delegateAuthority: delegateAuthority.publicKey,
    })
    .run();

  // When the delegated authority freezes the NFT.
  await mx.nfts().freezeDelegatedNft(nft, { delegateAuthority }).run();

  // Then the token account for that NFT is frozen.
  const delegatedNft = await mx.nfts().refresh(nft).run();
  spok(t, delegatedNft, {
    model: 'nft',
    $topic: 'Delegated NFT',
    token: {
      state: AccountState.Frozen,
    },
  } as unknown as Specifications<NftWithToken>);
});

test('[nftModule] the owner of the NFT cannot freeze its own NFT without a delegated authority', async (t: Test) => {
  // Given an existing NFT that's not delegated.
  const mx = await metaplex();
  const owner = Keypair.generate();
  const nft = await createNft(mx, { tokenOwner: owner.publicKey });

  // When the owner tried to freezes the NFT.
  const promise = mx
    .nfts()
    .freezeDelegatedNft(nft, {
      delegateAuthority: owner,
      tokenOwner: owner.publicKey,
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /InvalidDelegate: All tokens in this account have not been delegated to this user/
  );
});
