import test, { Test } from 'tape';
import { metaplex, createNft, killStuckProcess } from 'test/helpers';

killStuckProcess();

test('it can fetch all NFTs in a wallet', async (t: Test) => {
  // Given a metaplex instance and a connected wallet.
  const mx = await metaplex();
  const owner = mx.identity().publicKey;

  // And two NFTs inside that wallets.
  const nftA = await createNft(mx, { name: 'NFT A' });
  const nftB = await createNft(mx, { name: 'NFT B' });

  // When we fetch all NFTs in the wallet.
  const nfts = await mx.nfts().findAllByOwner(owner);

  // Then we get the right NFTs.
  t.same(nfts.map((nft) => nft.name).sort(), ['NFT A', 'NFT B']);
  t.same(
    nfts.map((nft) => nft.mint.toBase58()).sort(),
    [nftA.mint.toBase58(), nftB.mint.toBase58()].sort()
  );
});
