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
import { NftWithToken } from '@/index';

killStuckProcess();

test('[nftModule] a delegated authority can thaw its NFT', async (t: Test) => {
  // Given an existing delegated NFT that's already frozen.
  const mx = await metaplex();
  const delegateAuthority = Keypair.generate();
  const nft = await createNft(mx);
  await mx.tokens().approveDelegateAuthority({
    mintAddress: nft.address,
    delegateAuthority: delegateAuthority.publicKey,
  });

  await mx
    .nfts()
    .freezeDelegatedNft({ mintAddress: nft.address, delegateAuthority });

  // When the delegated authority thaws the NFT.
  await mx
    .nfts()
    .thawDelegatedNft({ mintAddress: nft.address, delegateAuthority });

  // Then the token account for that NFT is thawed.
  const thawedNft = await mx.nfts().refresh(nft);
  spok(t, thawedNft, {
    model: 'nft',
    $topic: 'Thawed NFT',
    token: {
      state: AccountState.Initialized,
    },
  } as unknown as Specifications<NftWithToken>);
});

test('[nftModule] the owner of the NFT cannot thaw its own NFT without a delegated authority', async (t: Test) => {
  // Given an existing delegated NFT that's already frozen.
  const mx = await metaplex();
  const delegateAuthority = Keypair.generate();
  const owner = Keypair.generate();
  const nft = await createNft(mx, { tokenOwner: owner.publicKey });
  await mx.tokens().approveDelegateAuthority({
    mintAddress: nft.address,
    delegateAuthority: delegateAuthority.publicKey,
    owner,
  });

  await mx.nfts().freezeDelegatedNft({
    mintAddress: nft.address,
    delegateAuthority,
    tokenOwner: owner.publicKey,
  });

  // When the owner tries to thaw the NFT.
  const promise = mx.nfts().thawDelegatedNft({
    mintAddress: nft.address,
    delegateAuthority: owner,
    tokenOwner: owner.publicKey,
  });

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /InvalidDelegate: All tokens in this account have not been delegated to this user/
  );
});
