import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import { Keypair } from '@solana/web3.js';
import { createNft, killStuckProcess, metaplex } from '../../helpers';
import { Nft } from '@/index';

killStuckProcess();

test.only('[nftModule] it can transfer an NFT', async (t: Test) => {
  // Given an NFT that belongs to owner A.
  const mx = await metaplex();
  const ownerA = Keypair.generate();
  const nft = await createNft(mx, {
    tokenOwner: ownerA.publicKey,
  });

  // When owner A transfers the NFT to owner B.
  const ownerB = Keypair.generate();
  await mx.nfts().transfer({
    mintAddress: nft.address,
    authority: ownerA,
    fromOwner: ownerA.publicKey,
    toOwner: ownerB.publicKey,
  });
  const updatedNft = await mx.nfts().refresh(nft);

  // Then the NFT was updated accordingly.
  // TODO
  spok(t, updatedNft, {
    model: 'nft',
    $topic: 'Updated NFT',
  } as unknown as Specifications<Nft>);
});

// TODO: It can transfer a Programmable NFT.
// TODO: It can partially transfer an SFT
