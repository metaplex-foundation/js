import type { Metadata, Metaplex } from '@/index';
import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { metaplex, createNft, killStuckProcess } from '../../helpers';

killStuckProcess();

const createNftWithAuthority = (
  mx: Metaplex,
  name: string,
  updateAuthority: Keypair
) => createNft(mx, { name, updateAuthority });

test('[nftModule] it can fetch all NFTs for a given update authority', async (t: Test) => {
  // Given a metaplex instance and 2 wallet.
  const mx = await metaplex();
  const walletA = Keypair.generate();
  const walletB = Keypair.generate();

  // Where wallet A is the update authority of NFT A and B but not C.
  const nftA = await createNftWithAuthority(mx, 'NFT A', walletA);
  const nftB = await createNftWithAuthority(mx, 'NFT B', walletA);
  await createNftWithAuthority(mx, 'NFT C', walletB);

  // When we fetch all NFTs where wallet A is the authority.
  const nfts = (await mx
    .nfts()
    .findAllByUpdateAuthority({ updateAuthority: walletA.publicKey })
    .run()) as Metadata[];

  // Then we get the right NFTs.
  t.same(nfts.map((nft) => nft.name).sort(), ['NFT A', 'NFT B']);
  t.same(
    nfts.map((nft) => nft.mintAddress.toBase58()).sort(),
    [nftA.address.toBase58(), nftB.address.toBase58()].sort()
  );
});
