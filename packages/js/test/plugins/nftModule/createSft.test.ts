import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { Keypair } from '@solana/web3.js';
import { UseMethod } from '@metaplex-foundation/mpl-token-metadata';
import { toMetaplexFile, Nft, toBigNumber, Sft, token } from '@/index';
import {
  metaplex,
  spokSamePubkey,
  spokSameBignum,
  killStuckProcess,
  amman,
  createWallet,
} from '../../helpers';

killStuckProcess();

test('[nftModule] it can create an SFT with minimum configuration', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And we uploaded some metadata containing an image.
  const { uri, metadata } = await mx
    .nfts()
    .uploadMetadata({
      name: 'JSON SFT name',
      description: 'JSON SFT description',
      image: toMetaplexFile('some_image', 'some-image.jpg'),
    })
    .run();

  // When we create a new SFT with minimum configuration.
  const { sft, mintAddress, metadataAddress } = await mx
    .nfts()
    .createSft({
      uri,
      name: 'On-chain SFT name',
      sellerFeeBasisPoints: 200,
    })
    .run();

  // Then we created and returned the new SFT and it has appropriate defaults.
  const expectedSft = {
    model: 'sft',
    name: 'On-chain SFT name',
    uri,
    address: spokSamePubkey(mintAddress),
    metadataAddress: spokSamePubkey(metadataAddress),
    updateAuthorityAddress: spokSamePubkey(mx.identity().publicKey),
    jsonLoaded: true,
    json: {
      name: 'JSON SFT name',
      description: 'JSON SFT description',
      image: metadata.image,
    },
    sellerFeeBasisPoints: 200,
    primarySaleHappened: false,
    creators: [
      {
        address: spokSamePubkey(mx.identity().publicKey),
        share: 100,
        verified: true,
      },
    ],
    collection: null,
    uses: null,
  } as unknown as Specifications<Sft>;
  spok(t, sft, { $topic: 'SFT', ...expectedSft });

  // And we get the same data when fetching a fresh instance of that SFT.
  const retrievedSft = await mx.nfts().findByMint(sft.address).run();
  spok(t, retrievedSft, { $topic: 'Retrieved SFT', ...expectedSft });
});

test.only('[nftModule] it can create an SFT with maximum configuration', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And a various keypairs for different access.
  const payer = await createWallet(mx);
  const mint = Keypair.generate();
  const collection = Keypair.generate();
  const owner = Keypair.generate();
  const mintAuthority = Keypair.generate();
  const freezeAuthority = Keypair.generate();
  const updateAuthority = Keypair.generate();
  const otherCreator = Keypair.generate();

  // When we create a new SFT with minimum configuration.
  const { sft } = await mx
    .nfts()
    .createSft({
      uri: 'https://example.com/some-json-uri',
      name: 'On-chain SFT name',
      symbol: 'MYSFT',
      sellerFeeBasisPoints: 456,
      isMutable: false,
      maxSupply: toBigNumber(123),
      mint: { new: mint },
      token: { owner: owner.publicKey, amount: token(42) },
      payer,
      mintAuthority,
      updateAuthority,
      freezeAuthority: freezeAuthority.publicKey,
      collection: {
        verified: false,
        key: collection.publicKey,
      },
      uses: {
        useMethod: UseMethod.Burn,
        remaining: 0,
        total: 1000,
      },
      creators: [
        {
          address: updateAuthority.publicKey,
          share: 60,
          verified: true,
        },
        {
          address: otherCreator.publicKey,
          share: 40,
          verified: false,
        },
      ],
    })
    .run();

  // Then we created and retrieved the new NFT and it has appropriate defaults.
  spok(t, sft, {
    $topic: 'SFT',
    model: 'sft',
    lazy: false,
    uri: 'https://example.com/some-json-uri',
    name: 'On-chain SFT name',
    symbol: 'MYSFT',
    json: null,
    jsonLoaded: true,
    sellerFeeBasisPoints: 456,
    primarySaleHappened: false,
    updateAuthorityAddress: spokSamePubkey(updateAuthority.publicKey),
    collection: {
      verified: false,
      key: spokSamePubkey(collection.publicKey),
    },
    uses: {
      useMethod: UseMethod.Burn,
      remaining: spokSameBignum(0),
      total: spokSameBignum(1000),
    },
    creators: [
      {
        address: spokSamePubkey(updateAuthority.publicKey),
        share: 60,
        verified: true,
      },
      {
        address: spokSamePubkey(otherCreator.publicKey),
        share: 40,
        verified: false,
      },
    ],
  } as unknown as Specifications<Sft>);
});

test('[nftModule] it can make another signer wallet pay for the storage and transaction fees', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();
  const initialIdentityBalance = await mx.connection.getBalance(
    mx.identity().publicKey
  );

  // And a keypair that will pay for the storage.
  const payer = Keypair.generate();
  await amman.airdrop(mx.connection, payer.publicKey, 1);
  t.equal(await mx.connection.getBalance(payer.publicKey), 1000000000);

  // When we create a new NFT using that account as a payer.
  const { nft } = await mx
    .nfts()
    .create({ ...minimalInput(), payer })
    .run();

  // Then the payer has less lamports than it used to.
  t.ok((await mx.connection.getBalance(payer.publicKey)) < 1000000000);

  // And the identity did not lose any lamports.
  t.equal(
    await mx.connection.getBalance(mx.identity().publicKey),
    initialIdentityBalance
  );

  // And the NFT was successfully created.
  spok(t, nft, { $topic: 'nft', model: 'nft', lazy: false });
});

test('[nftModule] it can create an NFT for other signer wallets without using the identity', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And a bunch of wallet used instead of the identity.
  const payer = Keypair.generate();
  const updateAuthority = Keypair.generate();
  const owner = Keypair.generate();
  await amman.airdrop(mx.connection, payer.publicKey, 1);

  // When we create a new NFT using these accounts.
  const { nft } = await mx
    .nfts()
    .create({
      ...minimalInput(),
      payer,
      updateAuthority,
      owner: owner.publicKey,
    })
    .run();

  // Then the NFT was successfully created and assigned to the right wallets.
  spok(t, nft, {
    $topic: 'nft',
    name: 'My NFT',
    updateAuthorityAddress: spokSamePubkey(updateAuthority.publicKey),
    creators: [
      {
        address: spokSamePubkey(updateAuthority.publicKey),
        share: 100,
        verified: true,
      },
    ],
  } as unknown as Specifications<Nft>);
});

test('[nftModule] it can create an NFT with an invalid URI', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create an NFT with an invalid URI.
  const { nft } = await mx
    .nfts()
    .create({ ...minimalInput(), uri: 'https://example.com/some/invalid/uri' })
    .run();

  // Then the NFT was created successfully.
  t.equal(nft.model, 'nft');
  t.equal(nft.uri, 'https://example.com/some/invalid/uri');

  // But its JSON metadata is null.
  t.equal(nft.json, null);
});

const minimalInput = () => ({
  uri: 'https://example.com/some-json-uri',
  name: 'My NFT',
  sellerFeeBasisPoints: 200,
});
