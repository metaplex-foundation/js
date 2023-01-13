import {
  createCreateMasterEditionV3Instruction,
  createCreateMetadataAccountV2Instruction,
  TokenStandard,
  UseMethod,
} from '@metaplex-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import { AccountState } from '@solana/spl-token';
import {
  amman,
  assertThrows,
  createCollectionNft,
  createWallet,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import {
  assertCollectionHasSize,
  assertRefreshedCollectionHasSize,
} from './helpers';
import {
  Nft,
  NftWithToken,
  toBigNumber,
  token,
  toMetaplexFile,
  TransactionBuilder,
} from '@/index';

killStuckProcess();

test('[nftModule] it can create an NFT with minimum configuration', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And we uploaded some metadata containing an image.
  const { uri, metadata } = await mx.nfts().uploadMetadata({
    name: 'JSON NFT name',
    description: 'JSON NFT description',
    image: toMetaplexFile('some_image', 'some-image.jpg'),
  });

  // When we create a new NFT with minimum configuration.
  const {
    nft,
    mintAddress,
    metadataAddress,
    masterEditionAddress,
    tokenAddress,
  } = await mx.nfts().create({
    uri,
    name: 'On-chain NFT name',
    sellerFeeBasisPoints: 500,
  });

  // Then we created and returned the new NFT and it has appropriate defaults.
  const expectedNft = {
    model: 'nft',
    name: 'On-chain NFT name',
    tokenStandard: TokenStandard.NonFungible,
    uri,
    address: spokSamePubkey(mintAddress),
    mint: {
      model: 'mint',
      address: spokSamePubkey(mintAddress),
      decimals: 0,
      supply: spokSameAmount(token(1)),
      mintAuthorityAddress: spokSamePubkey(masterEditionAddress),
      freezeAuthorityAddress: spokSamePubkey(masterEditionAddress),
    },
    token: {
      model: 'token',
      isAssociatedToken: true,
      mintAddress: spokSamePubkey(mintAddress),
      ownerAddress: spokSamePubkey(mx.identity().publicKey),
      amount: spokSameAmount(token(1)),
      closeAuthorityAddress: null,
      delegateAddress: null,
      delegateAmount: spokSameAmount(token(0)),
    },
    metadataAddress: spokSamePubkey(metadataAddress),
    updateAuthorityAddress: spokSamePubkey(mx.identity().publicKey),
    json: {
      name: 'JSON NFT name',
      description: 'JSON NFT description',
      image: metadata.image,
    },
    sellerFeeBasisPoints: 500,
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
    programmableConfig: null,
  } as unknown as Specifications<Nft>;
  spok(t, nft, { $topic: 'NFT', ...expectedNft });

  // And we get the same data when fetching a fresh instance of that NFT.
  const retrievedNft = await mx
    .nfts()
    .findByMint({ mintAddress: nft.address, tokenAddress });

  spok(t, retrievedNft, { $topic: 'Retrieved NFT', ...expectedNft });
});

test('[nftModule] it can create an NFT with maximum configuration', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And we uploaded some metadata.
  const { uri, metadata } = await mx.nfts().uploadMetadata({
    name: 'JSON NFT name',
    description: 'JSON NFT description',
    image: toMetaplexFile('some_image', 'some-image.jpg'),
  });

  // And a various keypairs for different access.
  const payer = await createWallet(mx);
  const mint = Keypair.generate();
  const collection = Keypair.generate();
  const owner = Keypair.generate();
  const mintAuthority = Keypair.generate();
  const updateAuthority = Keypair.generate();
  const otherCreator = Keypair.generate();

  // When we create a new NFT with minimum configuration.
  const { nft } = await mx.nfts().create(
    {
      tokenStandard: TokenStandard.NonFungible,
      uri,
      name: 'On-chain NFT name',
      symbol: 'MYNFT',
      sellerFeeBasisPoints: 456,
      isMutable: true,
      maxSupply: toBigNumber(123),
      useNewMint: mint,
      mintAuthority,
      updateAuthority,
      tokenOwner: owner.publicKey,
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
    },
    { payer }
  );

  // Then we created and retrieved the new NFT and it has appropriate defaults.
  spok(t, nft, {
    $topic: 'nft',
    model: 'nft',
    tokenStandard: TokenStandard.NonFungible,
    name: 'On-chain NFT name',
    symbol: 'MYNFT',
    uri,
    mint: {
      model: 'mint',
      address: spokSamePubkey(mint.publicKey),
      decimals: 0,
      supply: spokSameAmount(token(1, 0, 'MYNFT')),
    },
    token: {
      model: 'token',
      isAssociatedToken: true,
      mintAddress: spokSamePubkey(mint.publicKey),
      ownerAddress: spokSamePubkey(owner.publicKey),
      amount: spokSameAmount(token(1, 0, 'MYNFT')),
      closeAuthorityAddress: null,
      delegateAddress: null,
      delegateAmount: token(0, 0, 'MYNFT'),
    },
    json: {
      name: 'JSON NFT name',
      description: 'JSON NFT description',
      image: metadata.image,
    },
    sellerFeeBasisPoints: 456,
    primarySaleHappened: false,
    updateAuthorityAddress: spokSamePubkey(updateAuthority.publicKey),
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
  } as unknown as Specifications<Nft>);
});

test('[nftModule] it can create an NFT from an existing mint', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing mint.
  const mintAuthority = Keypair.generate();
  const { mint } = await mx.tokens().createMint({
    decimals: 0,
    mintAuthority: mintAuthority.publicKey,
  });

  // When we create a new SFT from that mint.
  const { nft, masterEditionAddress } = await mx.nfts().create({
    ...minimalInput(),
    useExistingMint: mint.address,
    mintAuthority,
    name: 'My NFT from an existing mint',
  });

  // Then we created an SFT whilst keeping the provided mint.
  spok(t, nft, {
    $topic: 'NFT',
    model: 'nft',
    name: 'My NFT from an existing mint',
    mint: {
      model: 'mint',
      address: spokSamePubkey(mint.address),
      decimals: 0,
      supply: spokSameAmount(token(1)),
      mintAuthorityAddress: spokSamePubkey(masterEditionAddress),
      freezeAuthorityAddress: spokSamePubkey(masterEditionAddress),
    },
    token: {
      model: 'token',
      isAssociatedToken: true,
      mintAddress: spokSamePubkey(mint.address),
      ownerAddress: spokSamePubkey(mx.identity().publicKey),
      amount: spokSameAmount(token(1)),
    },
  } as unknown as Specifications<NftWithToken>);
});

test('[nftModule] it can make another signer wallet pay for the storage and transaction fees', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();
  const initialIdentityBalance = await mx.connection.getBalance(
    mx.identity().publicKey
  );

  // And a keypair that will pay for the storage.
  const payer = await createWallet(mx, 1);
  t.equal(await mx.connection.getBalance(payer.publicKey), 1000000000);

  // When we create a new NFT using that account as a payer.
  const { nft } = await mx.nfts().create(minimalInput(), { payer });

  // Then the payer has less lamports than it used to.
  t.ok((await mx.connection.getBalance(payer.publicKey)) < 1000000000);

  // And the identity did not lose any lamports.
  t.equal(
    await mx.connection.getBalance(mx.identity().publicKey),
    initialIdentityBalance
  );

  // And the NFT was successfully created.
  spok(t, nft, { $topic: 'NFT', model: 'nft' });
});

test('[nftModule] it can create an NFT with an invalid URI', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create an NFT with an invalid URI.
  const { nft } = await mx
    .nfts()
    .create({ ...minimalInput(), uri: 'https://example.com/some/invalid/uri' });

  // Then the NFT was created successfully.
  t.equal(nft.model, 'nft');
  t.equal(nft.uri, 'https://example.com/some/invalid/uri');

  // But its JSON metadata is null.
  t.equal(nft.json, null);
});

test('[nftModule] it can create a collection NFT', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create a collection NFT.
  const { nft } = await mx
    .nfts()
    .create({ ...minimalInput(), isCollection: true });

  // Then the created NFT is a sized collection.
  spok(t, nft, {
    $topic: 'NFT',
    model: 'nft',
    collectionDetails: {
      version: 'V1',
      size: spokSameBignum(0),
    },
  } as unknown as Specifications<Nft>);
});

test('[nftModule] it can create an NFT with a parent Collection', async (t: Test) => {
  // Given a Metaplex instance and a collection NFT
  const mx = await metaplex();
  const collectionNft = await createCollectionNft(mx);
  assertCollectionHasSize(t, collectionNft, 0);

  // When we create a new NFT with this collection as a parent.
  const { nft } = await mx
    .nfts()
    .create({ ...minimalInput(), collection: collectionNft.address });

  // Then the created NFT is from that collection.
  spok(t, nft, {
    $topic: 'NFT',
    model: 'nft',
    collection: {
      address: spokSamePubkey(collectionNft.address),
      verified: false,
    },
  } as unknown as Specifications<Nft>);

  // And the collection NFT has the same size because we did not verify it.
  await assertRefreshedCollectionHasSize(t, mx, collectionNft, 0);
});

test('[nftModule] it can create an NFT with a verified parent Collection', async (t: Test) => {
  // Given a Metaplex instance and a collection NFT with an explicit update authority.
  const mx = await metaplex();
  const collectionUpdateAuthority = Keypair.generate();
  const collectionNft = await createCollectionNft(mx, {
    updateAuthority: collectionUpdateAuthority,
  });
  assertCollectionHasSize(t, collectionNft, 0);

  // When we create a new NFT with this collection as a parent and with its update authority.
  const { nft } = await mx.nfts().create({
    ...minimalInput(),
    collection: collectionNft.address,
    collectionAuthority: collectionUpdateAuthority,
  });

  // Then the created NFT is from that collection and it is verified.
  spok(t, nft, {
    $topic: 'NFT',
    model: 'nft',
    collection: {
      address: spokSamePubkey(collectionNft.address),
      verified: true,
    },
  } as unknown as Specifications<Nft>);

  // And the collection NFT size has been increase by 1.
  await assertRefreshedCollectionHasSize(t, mx, collectionNft, 1);
});

test('[nftModule] it can create an NFT with a verified parent Collection using a delegated authority', async (t: Test) => {
  // Given a Metaplex instance and a collection NFT.
  const mx = await metaplex();
  const collectionNft = await createCollectionNft(mx);
  assertCollectionHasSize(t, collectionNft, 0);

  // And a delegated collection authority for that collection NFT.
  const collectionDelegatedAuthority = Keypair.generate();
  await mx.nfts().approveCollectionAuthority({
    mintAddress: collectionNft.address,
    collectionAuthority: collectionDelegatedAuthority.publicKey,
  });

  // When we create a new NFT with this collection as a parent using the delegated authority.
  const { nft } = await mx.nfts().create({
    ...minimalInput(),
    collection: collectionNft.address,
    collectionAuthority: collectionDelegatedAuthority,
    collectionAuthorityIsDelegated: true,
  });

  // Then the created NFT is from that collection and it is verified.
  spok(t, nft, {
    $topic: 'NFT',
    model: 'nft',
    collection: {
      address: spokSamePubkey(collectionNft.address),
      verified: true,
    },
  } as unknown as Specifications<Nft>);

  // And the collection NFT size has been increase by 1.
  await assertRefreshedCollectionHasSize(t, mx, collectionNft, 1);
});

test('[nftModule] it can create a programmable NFT', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Programmable NFT.
  const ruleSet = Keypair.generate();
  const { nft } = await mx.nfts().create({
    ...minimalInput(),
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    ruleSet: ruleSet.publicKey,
  });

  // Then the Programmable NFT was created successfully.
  spok(t, nft, {
    $topic: 'nft',
    model: 'nft',
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    programmableConfig: {
      __kind: 'V1',
      ruleSet: spokSamePubkey(ruleSet.publicKey),
    },
    token: {
      state: AccountState.Frozen,
    },
  } as unknown as Specifications<Nft>);
});

test('[nftModule] it cannot create a programmable NFT from mint with supply greater than zero', async (t: Test) => {
  // Given a mint account with a supply of 1.
  const mx = await metaplex();
  const mintAddress = Keypair.generate();
  await mx.tokens().createTokenWithMint({
    mint: mintAddress,
    initialSupply: token(1),
  });

  // When we try to create a new Programmable NFT with it.
  const promise = mx.nfts().create({
    ...minimalInput(),
    useExistingMint: mintAddress.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
    mintTokens: false,
  });

  // Then we expect an error.
  await assertThrows(t, promise, /MintSupplyMustBeZero/);
});

const minimalInput = () => ({
  uri: 'https://example.com/some-json-uri',
  name: 'My NFT',
  sellerFeeBasisPoints: 200,
});

/*
 * Regression test.
 * @see https://github.com/metaplex-foundation/metaplex-program-library/issues/383
 */
test('[nftModule] it works when we give an explicit payer for the create metadata ix only', async (t: Test) => {
  // Given we have everything we need to create a Metadata account.
  const mx = await metaplex();
  const mint = Keypair.generate();
  const metadata = mx.nfts().pdas().metadata({ mint: mint.publicKey });
  const edition = mx.nfts().pdas().masterEdition({ mint: mint.publicKey });
  const { uri } = await mx.nfts().uploadMetadata({ name: 'Metadata Name' });

  const data = {
    name: 'My NFT',
    symbol: 'MNFT',
    sellerFeeBasisPoints: 10,
    uri,
    creators: [
      {
        address: mx.identity().publicKey,
        share: 100,
        verified: false,
      },
    ],
    collection: null,
    uses: null,
  };

  // And an explicit payer account that is only used to pay for the Metadata account storage.
  const explicitPayer = Keypair.generate();
  await amman.airdrop(mx.connection, explicitPayer.publicKey, 1);

  // When we assemble that transaction.
  const tx = TransactionBuilder.make()
    .add(
      await mx
        .tokens()
        .builders()
        .createTokenWithMint(
          { initialSupply: token(1), mint },
          { payer: mx.identity() }
        )
    )
    .add({
      instruction: createCreateMetadataAccountV2Instruction(
        {
          metadata,
          mint: mint.publicKey,
          mintAuthority: mx.identity().publicKey,
          payer: explicitPayer.publicKey,
          updateAuthority: mx.identity().publicKey,
        },
        { createMetadataAccountArgsV2: { data, isMutable: false } }
      ),
      signers: [explicitPayer],
    })
    .add({
      instruction: createCreateMasterEditionV3Instruction(
        {
          edition,
          mint: mint.publicKey,
          updateAuthority: mx.identity().publicKey,
          mintAuthority: mx.identity().publicKey,
          payer: explicitPayer.publicKey,
          metadata,
        },
        {
          createMasterEditionArgs: { maxSupply: 0 },
        }
      ),
      signers: [explicitPayer],
    });

  // And send it with confirmation.
  await mx.rpc().sendAndConfirmTransaction(tx);

  // Then the transaction succeeded and the NFT was created.
  const nft = await mx.nfts().findByMint({ mintAddress: mint.publicKey });
  t.equal(nft.name, 'My NFT');
  t.equal(nft.metadataAddress.toBase58(), metadata.toBase58());
});
