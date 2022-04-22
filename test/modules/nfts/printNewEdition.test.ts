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

test('it keeps track of the edition number', async (t: Test) => {
  // Given an existing Original NFT.
  const mx = await metaplex();
  const originalNft = await createNft(mx, {}, { maxSupply: 100 });

  // When we print 3 new editions of the NFT.
  const originalMint = originalNft.mint;
  const { nft: printNft1 } = await mx.nfts().printNewEdition({ originalMint });
  const { nft: printNft2 } = await mx.nfts().printNewEdition({ originalMint });
  const { nft: printNft3 } = await mx.nfts().printNewEdition({ originalMint });

  // Then each edition knows its number.
  t.equal(printNft1.printEdition?.edition.toString(), '1');
  t.equal(printNft2.printEdition?.edition.toString(), '2');
  t.equal(printNft3.printEdition?.edition.toString(), '3');

  // And they are all associated with the same parent.
  const expectedParent = originalNft.editionAccount?.publicKey.toBase58();
  t.equal(printNft1.printEdition?.parent.toBase58(), expectedParent);
  t.equal(printNft2.printEdition?.parent.toBase58(), expectedParent);
  t.equal(printNft3.printEdition?.parent.toBase58(), expectedParent);
});
