import test, { Test } from 'tape';
import spok, { Specifications } from 'spok';
import { Keypair } from '@solana/web3.js';
import { UseMethod } from '@metaplex-foundation/mpl-token-metadata';
import { toMetaplexFile, toBigNumber, Sft, token, SftWithToken } from '@/index';
import {
  metaplex,
  spokSamePubkey,
  spokSameBignum,
  killStuckProcess,
  createWallet,
  spokSameAmount,
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
    mint: {
      model: 'mint',
      decimals: 0,
      supply: spokSameAmount(token(0)),
      mintAuthorityAddress: spokSamePubkey(mx.identity().publicKey),
      freezeAuthorityAddress: spokSamePubkey(mx.identity().publicKey),
    },
    token: spok.notDefined,
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

test('[nftModule] it can create an SFT with maximum configuration', async (t: Test) => {
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

  // When we create a new SFT with maximum configuration.
  const { sft } = await mx
    .nfts()
    .createSft({
      uri: 'https://example.com/some-json-uri',
      name: 'On-chain SFT name',
      symbol: 'MYSFT',
      decimals: 2,
      sellerFeeBasisPoints: 456,
      isMutable: false,
      maxSupply: toBigNumber(123),
      mint: { new: mint },
      token: { owner: owner.publicKey, amount: token(4200) },
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

  // Then the created SFT has the expected configuration.
  spok(t, sft, {
    $topic: 'SFT With Token',
    model: 'sft',
    uri: 'https://example.com/some-json-uri',
    name: 'On-chain SFT name',
    symbol: 'MYSFT',
    json: null,
    jsonLoaded: true,
    sellerFeeBasisPoints: 456,
    primarySaleHappened: false,
    updateAuthorityAddress: spokSamePubkey(updateAuthority.publicKey),
    mint: {
      model: 'mint',
      address: spokSamePubkey(mint.publicKey),
      decimals: 2,
      supply: spokSameAmount(token(42, 2, 'MYSFT')),
      mintAuthorityAddress: spokSamePubkey(mintAuthority.publicKey),
      freezeAuthorityAddress: spokSamePubkey(freezeAuthority.publicKey),
    },
    token: {
      model: 'token',
      isAssociatedToken: true,
      mintAddress: spokSamePubkey(mint.publicKey),
      ownerAddress: spokSamePubkey(owner.publicKey),
      amount: spokSameAmount(token(42, 2, 'MYSFT')),
      closeAuthorityAddress: null,
      delegateAddress: null,
      delegateAmount: token(0, 2, 'MYSFT'),
    },
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
  } as unknown as Specifications<SftWithToken>);
});

test('[nftModule] it can create an SFT from an existing mint', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing mint.
  const { mint } = await mx.tokens().createMint({ decimals: 2 }).run();

  // When we create a new SFT from that mint.
  const { sft } = await mx
    .nfts()
    .createSft({
      ...minimalInput(),
      mint: { existing: mint.address },
      name: 'My SFT from an existing mint',
      symbol: '',
      decimals: 9, // <- This will not be used on existing mints.
    })
    .run();

  // Then ...
  spok(t, sft, {
    $topic: 'SFT',
    model: 'sft',
    name: 'My SFT from an existing mint',
    mint: {
      model: 'mint',
      address: spokSamePubkey(mint.address),
      decimals: 2,
      supply: spokSameAmount(token(0, 2)),
    },
    token: spok.notDefined,
  } as unknown as Specifications<Sft>);
});

test('[nftModule] it can create an SFT with an associated token', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // When we create a new SFT ...
  const { sft } = await mx
    .nfts()
    .createSft({ ...minimalInput() })
    .run();

  // Then ...
  spok(t, sft, {
    $topic: 'SFT',
    model: 'SFT',
    // ...
  } as unknown as Specifications<Sft>);
});

test('[nftModule] it can create an SFT from an existing mint and mint to an existing token account', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // When we create a new SFT ...
  const { sft } = await mx
    .nfts()
    .createSft({ ...minimalInput() })
    .run();

  // Then ...
  spok(t, sft, {
    $topic: 'SFT',
    model: 'SFT',
    // ...
  } as unknown as Specifications<Sft>);
});

const minimalInput = () => ({
  uri: 'https://example.com/some-json-uri',
  name: 'My NFT',
  sellerFeeBasisPoints: 200,
});
