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
    .tokens()
    .approveDelegateAuthority({
      mintAddress: nft.address,
      delegateAuthority: delegateAuthority.publicKey,
    })
    .run();

  // When the delegated authority freezes the NFT.
  await mx
    .nfts()
    .freezeDelegatedNft({ mintAddress: nft.address, delegateAuthority })
    .run();

  // Then the token account for that NFT is frozen.
  const frozenNft = await mx.nfts().refresh(nft).run();
  spok(t, frozenNft, {
    model: 'nft',
    $topic: 'Frozen NFT',
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

  // When the owner tries to freeze the NFT.
  const promise = mx
    .nfts()
    .freezeDelegatedNft({
      mintAddress: nft.address,
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
