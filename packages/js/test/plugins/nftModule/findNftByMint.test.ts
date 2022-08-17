import { NftWithToken } from '@/plugins';
import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import {
  metaplex,
  createNft,
  killStuckProcess,
  createSft,
} from '../../helpers';

killStuckProcess();

test('[nftModule] it can fetch an NFT by its mint address', async (t: Test) => {
  // Given a metaplex instance and an existing NFT.
  const mx = await metaplex();
  const mint = Keypair.generate();
  const nft = await createNft(mx, {
    useNewMint: mint,
    json: { name: 'Some NFT' },
  });

  // When we fetch that NFT using its mint address and its token address.
  const fetchedNft = (await mx
    .nfts()
    .findByMint({
      mintAddress: nft.address,
      tokenAddress: nft.token.address,
    })
    .run()) as NftWithToken;

  // Then we get the right NFT.
  t.same(fetchedNft.name, nft.name);
  t.same(fetchedNft.uri, nft.uri);
  t.same(fetchedNft.edition, nft.edition);
  t.ok(fetchedNft.address.equals(nft.address));
  t.ok(fetchedNft.metadataAddress.equals(nft.metadataAddress));
  t.ok(fetchedNft.mint.address.equals(nft.mint.address));
});

test('[nftModule] it can fetch an SFT by its mint address', async (t: Test) => {
  // Given a metaplex instance and an existing SFT.
  const mx = await metaplex();
  const mint = Keypair.generate();
  const sft = await createSft(mx, {
    useNewMint: mint,
    json: { name: 'Some SFT' },
  });

  // When we fetch that SFT using its mint address.
  const fetchedSft = await mx
    .nfts()
    .findByMint({ mintAddress: mint.publicKey })
    .run();

  // Then we get the right SFT.
  t.same(fetchedSft, sft);
});

test('[nftModule] it can fetch an NFT with an invalid URI', async (t: Test) => {
  // Given an existing NFT with an invalid URI.
  const mx = await metaplex();
  const { nft } = await mx
    .nfts()
    .create({
      name: 'Some NFT',
      sellerFeeBasisPoints: 200,
      uri: 'https://example.com/some/invalid/uri',
    })
    .run();

  // When we fetch that NFT using its mint address.
  const fetchedNft = await mx
    .nfts()
    .findByMint({ mintAddress: nft.address })
    .run();

  // Then we get the right NFT.
  t.same(fetchedNft.address, nft.address);

  // And its metadata is empty.
  t.same(fetchedNft.json, null);
});
