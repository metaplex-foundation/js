import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import {
  createNft,
  createSft,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSamePubkey,
} from '../../helpers';
import { Nft, Sft, token } from '@/index';

killStuckProcess();

test('[nftModule] it can transfer an NFT', async (t: Test) => {
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
    nftOrSft: nft,
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

test('[nftModule] it can create token accounts when transferring NFTs', async (t: Test) => {
  // Given an NFT that belongs to owner A.
  const mx = await metaplex();
  const ownerA = Keypair.generate();
  const nft = await createNft(mx, {
    tokenOwner: ownerA.publicKey,
  });

  // When owner A transfers the NFT to owner B
  // without creating the token account first.
  const ownerB = Keypair.generate();
  await mx.nfts().transfer({
    nftOrSft: nft,
    authority: ownerA,
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

test('[nftModule] it can can partially transfer an SFT', async (t: Test) => {
  // Given an SFT that belongs to owner A with 42 tokens.
  const mx = await metaplex();
  const ownerA = Keypair.generate();
  const sft = await createSft(mx, {
    tokenOwner: ownerA.publicKey,
    tokenAmount: token(42),
  });

  // When owner A transfers 10 tokens of that SFT to owner B
  const ownerB = Keypair.generate();
  await mx.nfts().transfer({
    nftOrSft: sft,
    authority: ownerA,
    toOwner: ownerB.publicKey,
    amount: token(10),
  });

  // Then owner B now owns 10 tokens of that SFT.
  const updatedSftForOwnerB = await mx.nfts().findByMint({
    mintAddress: sft.address,
    tokenOwner: ownerB.publicKey,
  });
  spok(t, updatedSftForOwnerB, {
    $topic: 'Updated SFT',
    model: 'sft',
    address: spokSamePubkey(sft.address),
    token: {
      ownerAddress: spokSamePubkey(ownerB.publicKey),
      amount: spokSameAmount(token(10)),
    },
  } as unknown as Specifications<Sft>);

  // And owner A still owns 32 tokens of that SFT.
  const updatedSftForOwnerA = await mx.nfts().findByMint({
    mintAddress: sft.address,
    tokenOwner: ownerA.publicKey,
  });
  spok(t, updatedSftForOwnerA, {
    $topic: 'Updated SFT',
    model: 'sft',
    address: spokSamePubkey(sft.address),
    token: {
      ownerAddress: spokSamePubkey(ownerA.publicKey),
      amount: spokSameAmount(token(32)),
    },
  } as unknown as Specifications<Sft>);
});

test('[nftModule] it can transfer a Programmable NFT', async (t: Test) => {
  // Given a Programmable NFT that belongs to owner A.
  const mx = await metaplex();
  const ownerA = Keypair.generate();
  const nft = await createNft(mx, {
    tokenOwner: ownerA.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
  });

  // When owner A transfers the NFT to owner B.
  const ownerB = Keypair.generate();
  await mx.nfts().transfer({
    nftOrSft: nft,
    authority: ownerA,
    fromOwner: ownerA.publicKey,
    toOwner: ownerB.publicKey,
  });

  // Then the NFT now belongs to owner B.
  const updatedNft = await mx.nfts().findByMint({
    mintAddress: nft.address,
    tokenOwner: ownerB.publicKey,
  });
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
