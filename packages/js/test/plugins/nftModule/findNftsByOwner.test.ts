import test, { Test } from 'tape';
import { metaplex, createNft, killStuckProcess } from '../../helpers';
import { MetadataWithToken } from '@/index';

killStuckProcess();

test('[nftModule] it can fetch all NFTs in a wallet', async (t: Test) => {
  // Given a metaplex instance and a connected wallet.
  const mx = await metaplex();
  const owner = mx.identity().publicKey;

  // And two NFTs inside that wallets.
  const nftA = await createNft(mx, { name: 'NFT A' });
  const nftB = await createNft(mx, { name: 'NFT B' });

  // When we fetch all NFTs in the wallet.
  const nfts = (await mx.nfts().findAllByOwner({ owner })) as MetadataWithToken[];

  // Then we get the right NFTs.
  t.same(nfts.map((nft) => nft.name).sort(), ['NFT A', 'NFT B']);
  t.same(
    nfts.map((nft) => nft.mintAddress.toBase58()).sort(),
    [nftA.address.toBase58(), nftB.address.toBase58()].sort()
  );

  // With the corresponding token account.
  t.same(
    nfts.map((nft) => nft.token.address.toBase58()).sort(),
    [nftA.token.address.toBase58(), nftB.token.address.toBase58()].sort()
  )
});
