import test, { Test } from 'tape';
import {
  assertThrows,
  createNft,
  killStuckProcess,
  metaplex,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import spok, { Specifications } from 'spok';
import { Nft, toBigNumber } from '@/index';
import { assertNftOriginalEdition } from '@/plugins/nftModule/NftEdition';

killStuckProcess();

test('[nftModule] it can print a new edition from an original edition', async (t: Test) => {
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
      maxSupply: toBigNumber(100),
    }
  );

  // When we print a new edition of the NFT.
  const { nft: printNft, updatedOriginalNft } = await mx
    .nfts()
    .printNewEdition(originalNft)
    .run();

  // Then we created and returned the printed NFT with the right data.
  const expectedNft = {
    name: 'Original Nft On-Chain Name',
    json: {
      name: 'Original Nft Name',
      description: 'Original Nft Description',
    },
    edition: {
      isOriginal: false,
      parent: spokSamePubkey(originalNft.edition.address),
      number: spokSameBignum(1),
    },
  } as unknown as Specifications<Nft>;
  spok(t, printNft, { $topic: 'nft', ...expectedNft });

  // And the data was stored in the blockchain.
  const retrievedNft = await mx.nfts().findByMint(printNft.mintAddress).run();
  spok(t, retrievedNft, { $topic: 'Retrieved Nft', ...expectedNft });

  // And the original NFT was updated.
  const updatedEdition = updatedOriginalNft.edition;
  assertNftOriginalEdition(updatedEdition);
  t.equals(updatedEdition.supply.toNumber(), 1, 'original edition was updated');
});

test.only('[nftModule] it keeps track of the edition number', async (t: Test) => {
  // Given an existing Original NFT.
  const mx = await metaplex();
  const originalNft = await createNft(mx, {}, { maxSupply: toBigNumber(100) });

  // When we print 3 new editions of the NFT.
  const { nft: printNft1 } = await mx.nfts().printNewEdition(originalNft).run();
  const { nft: printNft2 } = await mx.nfts().printNewEdition(originalNft).run();
  const { nft: printNft3 } = await mx.nfts().printNewEdition(originalNft).run();

  // Then each edition knows their number and are associated with the same parent.
  isPrintOfOriginal(t, printNft1, originalNft, 1);
  isPrintOfOriginal(t, printNft2, originalNft, 2);
  isPrintOfOriginal(t, printNft3, originalNft, 3);
});

test('[nftModule] it can print unlimited editions', async (t: Test) => {
  // Given an existing Original NFT with no explicit maxSupply.
  const mx = await metaplex();
  const originalNft = await createNft(mx);

  // When we print an edition of the NFT.
  const { nft: printNft } = await mx.nfts().printNewEdition(originalNft.mint);

  // Then we successfully printed the first NFT of an unlimited collection.
  isPrintOfOriginal(t, printNft, originalNft, 1);
});

test('[nftModule] it cannot print when the maxSupply is zero', async (t: Test) => {
  // Given an existing Original NFT with a maxSupply of zero.
  const mx = await metaplex();
  const originalNft = await createNft(mx, {}, { maxSupply: 0 });

  // When we try to print an edition of the NFT.
  const promise = mx.nfts().printNewEdition(originalNft.mint);

  // Then we should get an error.
  await assertThrows(t, promise, /Maximum editions printed already/);
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
      parent: spokSamePubkey(original.edition.address),
      edition: spokSameBignum(edition),
    },
  } as unknown as Specifications<Nft>);
};
