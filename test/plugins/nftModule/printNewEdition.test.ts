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
  const { nft: printNft } = await mx.nfts().printNewEdition(originalNft.mint);

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
  const retrievedNft = await mx.nfts().findByMint(printNft.mint);
  spok(t, retrievedNft, { $topic: 'Retrieved Nft', ...expectedNft });
});

test('it keeps track of the edition number', async (t: Test) => {
  // Given an existing Original NFT.
  const mx = await metaplex();
  const originalNft = await createNft(mx, {}, { maxSupply: 100 });

  // When we print 3 new editions of the NFT.
  const { nft: printNft1 } = await mx.nfts().printNewEdition(originalNft.mint);
  const { nft: printNft2 } = await mx.nfts().printNewEdition(originalNft.mint);
  const { nft: printNft3 } = await mx.nfts().printNewEdition(originalNft.mint);

  // Then each edition knows their number and are associated with the same parent.
  isPrintOfOriginal(t, printNft1, originalNft, 1);
  isPrintOfOriginal(t, printNft2, originalNft, 2);
  isPrintOfOriginal(t, printNft3, originalNft, 3);
});

test('it can print unlimited editions', async (t: Test) => {
  // Given an existing Original NFT with no explicit maxSupply.
  const mx = await metaplex();
  const originalNft = await createNft(mx);

  // When we print an edition of the NFT.
  const { nft: printNft } = await mx.nfts().printNewEdition(originalNft.mint);

  // Then we successfully printed the first NFT of an unlimited collection.
  isPrintOfOriginal(t, printNft, originalNft, 1);
});

test('it cannot print when the maxSupply is zero', async (t: Test) => {
  // Given an existing Original NFT with a maxSupply of zero.
  const mx = await metaplex();
  const originalNft = await createNft(mx, {}, { maxSupply: 0 });

  try {
    // When we try to print an edition of the NFT.
    await mx.nfts().printNewEdition(originalNft.mint);
    t.fail('The NFT should not have printed');
  } catch (error) {
    // Then we should get an error.
    t.ok(error, 'got an error');
    // TODO: Assert on the right error when  integrated with Cusper.
  }
});

const isPrintOfOriginal = (
  t: Test,
  print: Nft,
  original: Nft,
  edition: number
) => {
  spok(t, print, {
    $topic: 'print NFT #' + edition,
    printEdition: {
      parent: spokSamePubkey(original.editionAccount?.publicKey ?? null),
      edition: spokSameBignum(edition),
    },
  } as unknown as Specifications<Nft>);
};
