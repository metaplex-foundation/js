import { Sft, SftWithToken, token, toMetaplexFile } from '@/index';
import { UseMethod } from '@metaplex-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import {
  createWallet,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
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
  const retrievedSft = await mx
    .nfts()
    .findByMint({ mintAddress: sft.address })
    .run();
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
      useNewMint: mint,
      tokenOwner: owner.publicKey,
      tokenAmount: token(4200),
      payer,
      mintAuthority,
      updateAuthority,
      freezeAuthority: freezeAuthority.publicKey,
      collection: collection.publicKey,
      uses: {
        useMethod: UseMethod.Burn,
        remaining: 0,
        total: 1000,
      },
      creators: [
        {
          address: updateAuthority.publicKey,
          share: 60,
        },
        {
          address: otherCreator.publicKey,
          share: 40,
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
      address: spokSamePubkey(collection.publicKey),
      verified: false,
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
  const mintAuthority = Keypair.generate();
  const { mint } = await mx
    .tokens()
    .createMint({ decimals: 2, mintAuthority: mintAuthority.publicKey })
    .run();

  // When we create a new SFT from that mint.
  const { sft } = await mx
    .nfts()
    .createSft({
      ...minimalInput(),
      useExistingMint: mint.address,
      mintAuthority: mintAuthority,
      name: 'My SFT from an existing mint',
      symbol: 'MYSFT',
      decimals: 9, // <- This will not be used on existing mints.
    })
    .run();

  // Then we created an SFT whilst keeping the provided mint.
  spok(t, sft, {
    $topic: 'SFT',
    model: 'sft',
    name: 'My SFT from an existing mint',
    symbol: 'MYSFT',
    mint: {
      model: 'mint',
      address: spokSamePubkey(mint.address),
      decimals: 2,
      supply: spokSameAmount(token(0, 2, 'MYSFT')),
      mintAuthorityAddress: spokSamePubkey(mint.mintAuthorityAddress),
      freezeAuthorityAddress: spokSamePubkey(mint.freezeAuthorityAddress),
    },
    token: spok.notDefined,
  } as unknown as Specifications<Sft>);
});

test('[nftModule] it can create an SFT with a new associated token', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // When we create a new SFT with a token account.
  const { sft } = await mx
    .nfts()
    .createSft({
      ...minimalInput(),
      tokenOwner: mx.identity().publicKey,
      tokenAmount: token(42),
    })
    .run();

  // Then the created SFT has the expected configuration.
  spok(t, sft, {
    $topic: 'SFT',
    model: 'sft',
    mint: {
      model: 'mint',
      decimals: 0,
      supply: spokSameAmount(token(42)),
    },
    token: {
      model: 'token',
      isAssociatedToken: true,
      ownerAddress: spokSamePubkey(mx.identity().publicKey),
      amount: spokSameAmount(token(42)),
      closeAuthorityAddress: null,
      delegateAddress: null,
      delegateAmount: token(0),
    },
  } as unknown as Specifications<Sft>);
});

test('[nftModule] it can create an SFT with a new non-associated token', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // When we create a new SFT with a non-associated token account.
  const tokenSigner = Keypair.generate();
  const { sft } = await mx
    .nfts()
    .createSft({
      ...minimalInput(),
      tokenAddress: tokenSigner,
      tokenAmount: token(42),
    })
    .run();

  // Then the created SFT has the expected configuration.
  spok(t, sft, {
    $topic: 'SFT',
    model: 'sft',
    mint: {
      model: 'mint',
      decimals: 0,
      supply: spokSameAmount(token(42)),
    },
    token: {
      model: 'token',
      address: spokSamePubkey(tokenSigner.publicKey),
      isAssociatedToken: false,
      amount: spokSameAmount(token(42)),
      closeAuthorityAddress: null,
      delegateAddress: null,
      delegateAmount: token(0),
    },
  } as unknown as Specifications<Sft>);
});

test('[nftModule] it can create an SFT from an existing mint and mint to an existing token account', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And a token and a mint account.
  const tokenSigner = Keypair.generate();
  const { token: existingToken } = await mx
    .tokens()
    .createTokenWithMint({ token: tokenSigner })
    .run();
  const existingMint = existingToken.mint;

  // When we create a new SFT for that mint and mint to an existing token account.
  const { sft } = await mx
    .nfts()
    .createSft({
      ...minimalInput(),
      useExistingMint: existingMint.address,
      tokenAddress: tokenSigner,
      tokenAmount: token(42),
    })
    .run();

  // Then the created SFT has the expected configuration.
  spok(t, sft, {
    $topic: 'SFT',
    model: 'sft',
    mint: {
      model: 'mint',
      address: spokSamePubkey(existingMint.address),
      decimals: 0,
      supply: spokSameAmount(token(42)),
    },
    token: {
      model: 'token',
      address: spokSamePubkey(existingToken.address),
      isAssociatedToken: false,
      amount: spokSameAmount(token(42)),
      closeAuthorityAddress: null,
      delegateAddress: null,
      delegateAmount: token(0),
    },
  } as unknown as Specifications<Sft>);
});

test('[nftModule] it can create an SFT with additional verified creators', async (t: Test) => {
  // Given we have a Metaplex instance and 2 additional creators.
  const mx = await metaplex();
  const creatorA = Keypair.generate();
  const creatorB = Keypair.generate();

  // When we create a new SFT with these creators as signers.
  const { sft } = await mx
    .nfts()
    .createSft({
      ...minimalInput(),
      creators: [
        {
          address: mx.identity().publicKey,
          share: 40,
        },
        {
          address: creatorA.publicKey,
          authority: creatorA,
          share: 35,
        },
        {
          address: creatorB.publicKey,
          authority: creatorB,
          share: 25,
        },
      ],
    })
    .run();

  // Then the created SFT has all creators verified.
  spok(t, sft, {
    $topic: 'SFT',
    model: 'sft',
    creators: [
      {
        address: spokSamePubkey(mx.identity().publicKey),
        share: 40,
        verified: true,
      },
      {
        address: spokSamePubkey(creatorA.publicKey),
        share: 35,
        verified: true,
      },
      {
        address: spokSamePubkey(creatorB.publicKey),
        share: 25,
        verified: true,
      },
    ],
  } as Specifications<Sft>);
});

const minimalInput = () => ({
  uri: 'https://example.com/some-json-uri',
  name: 'My NFT',
  sellerFeeBasisPoints: 200,
});
