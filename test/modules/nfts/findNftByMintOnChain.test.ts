import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { metaplex, createNft } from '../../helpers/index.js';

test('it can fetch an NFT by its mint address', async (t: Test) => {
  // Given a metaplex instance and an existing NFT.
  const mx = await metaplex();
  const mint = Keypair.generate();
  const nft = await createNft(mx, { name: 'Some NFT' }, { mint });

  // When we fetch that NFT using its mint address.
  const fetchedNft = await mx.nfts().findNftByMint(mint.publicKey);

  // Then we get the right NFT.
  t.true(fetchedNft.is(nft));
});
