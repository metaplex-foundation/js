import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import {
  createNft,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSamePubkey,
} from '../../helpers';
import { Nft, token } from '@/index';

killStuckProcess();

// TODO: It can transfer an NFT without creating the token account first?

test.only('[nftModule] it can transfer an NFT', async (t: Test) => {
  // Given an NFT that belongs to owner A.
  const mx = await metaplex();
  const ownerA = Keypair.generate();
  const nft = await createNft(mx, {
    tokenOwner: ownerA.publicKey,
  });

  // And an owner B with an empty token account.
  const ownerB = Keypair.generate();
  await mx.tokens().createToken({ mint: nft.address, owner: ownerB.publicKey });

  // When owner A transfers the NFT to owner B.
  await mx.nfts().transfer({
    mintAddress: nft.address,
    authority: ownerA,
    fromOwner: ownerA.publicKey,
    toOwner: ownerB.publicKey,
  });
  const updatedNft = await mx.nfts().findByMint({
    mintAddress: nft.address,
    tokenOwner: ownerB.publicKey,
  });

  // Then the NFT now belongs to owner B.
  spok(t, updatedNft, {
    $topic: 'Updated NFT',
    model: 'nft',
    address: spokSamePubkey(nft.address),
    token: {
      ownerAddress: spokSamePubkey(ownerB.publicKey),
      amount: spokSameAmount(token(1)),
    },
  } as unknown as Specifications<Nft>);
});

test('[nftModule] it can transfer a Programmable NFT', async (t: Test) => {
  // Given a Programmable NFT that belongs to owner A.
  const mx = await metaplex();
  const ownerA = Keypair.generate();
  const nft = await createNft(mx, {
    tokenOwner: ownerA.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // And an owner B with an empty token account.
  const ownerB = Keypair.generate();
  await mx.tokens().createToken({ mint: nft.address, owner: ownerB.publicKey });

  // When owner A transfers the NFT to owner B.
  await mx.nfts().transfer({
    mintAddress: nft.address,
    authority: ownerA,
    fromOwner: ownerA.publicKey,
    toOwner: ownerB.publicKey,
  });
  const updatedNft = await mx.nfts().findByMint({
    mintAddress: nft.address,
    tokenOwner: ownerB.publicKey,
  });

  // Then the NFT now belongs to owner B.
  spok(t, updatedNft, {
    $topic: 'Updated NFT',
    model: 'nft',
    address: spokSamePubkey(nft.address),
    token: {
      ownerAddress: spokSamePubkey(ownerB.publicKey),
      amount: spokSameAmount(token(1)),
    },
  } as unknown as Specifications<Nft>);
});

// TODO: It can transfer an NFT without creating the token account first?
// TODO: It can transfer a Programmable NFT.
// TODO: It can partially transfer an SFT
