import test, { Test } from 'tape';
import { metaplex, createNft, killStuckProcess } from '../../helpers';

killStuckProcess();

test('it can mint a new edition from a master edition', async (t: Test) => {
  // Given
  const mx = await metaplex();
  const nft = await createNft(mx, { name: 'Nft A' }, { maxSupply: 100 });

  // When
  const foo = await mx.nfts().mintNewEdition({ masterMint: nft.mint, via: 'token' });
  console.log(foo);

  // Then
});
