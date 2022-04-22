import test, { Test } from 'tape';
import {
  createNft,
  killStuckProcess,
  metaplex,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import spok, { Specifications } from 'spok';
import { Nft } from '@/index';

killStuckProcess();

test('it can print a new edition from an original edition', async (t: Test) => {
  // Given an existing Original NFT.
  const mx = await metaplex();
  const originalNft = await createNft(
    mx,
    {
      name: 'Original Nft Name',
      description: 'Original Nft Description',
    },
    {
      name: 'Original Nft On-Chain Name',
      maxSupply: 100,
    }
  );

  // When we print a new edition of the NFT.
  const { nft: printNft } = await mx.nfts().printNewEdition({
    originalMint: originalNft.mint,
  });

  // Then we created and returned the printed NFT with the right data.
  const expectedNft = {
    name: 'Original Nft On-Chain Name',
    metadata: {
      name: 'Original Nft Name',
      description: 'Original Nft Description',
    },
    printEdition: {
      parent: spokSamePubkey(originalNft.editionAccount?.publicKey ?? null),
      edition: spokSameBignum(1),
    },
  } as unknown as Specifications<Nft>;
  spok(t, printNft, { $topic: 'nft', ...expectedNft });

  // And the data was stored in the blockchain.
  const retrievedNft = await mx.nfts().findNftByMint(printNft.mint);
  spok(t, retrievedNft, { $topic: 'Retrieved Nft', ...expectedNft });
});
