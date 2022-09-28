import { Nft } from '@/index';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import { createNft, killStuckProcess, metaplex } from '../../helpers';

killStuckProcess();

test('[nftModule] it can unverify a creator', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing NFT with an verified creator.
  const creator = Keypair.generate();
  const nft = await createNft(mx, {
    creators: [
      {
        address: mx.identity().publicKey,
        share: 60,
      },
      {
        address: creator.publicKey,
        authority: creator,
        share: 40,
      },
    ],
  });
  t.ok(nft.creators[0].verified, 'update authority is verified');
  t.ok(nft.creators[1].verified, 'creator is verified');

  // When we unverify the creator.
  await mx.nfts().unverifyCreator({ mintAddress: nft.address, creator }).run();

  // Then the returned NFT should have the updated data.
  const updatedNft = await mx.nfts().refresh(nft).run();
  spok(t, updatedNft, {
    $topic: 'Updated Nft',
    model: 'nft',
    creators: [
      {
        address: mx.identity().publicKey,
        verified: true,
        share: 60,
      },
      {
        address: creator.publicKey,
        verified: false,
        share: 40,
      },
    ],
  } as unknown as Specifications<Nft>);
});
