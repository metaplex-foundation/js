import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test from 'tape';
import {
  assertThrows,
  createCollectionNft,
  createWallet,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import { create32BitsHash } from './helpers';
import {
  CandyMachine,
  candyMachineProgram,
  defaultCandyGuardProgram,
  emptyDefaultCandyGuardSettings,
  sol,
  toBigNumber,
  toDateTime,
} from '@/index';

killStuckProcess();

test('[candyMachineModule] create candy machine with minimum configuration', async (t) => {
  // Given an existing Collection NFT.
  const mx = await metaplex();
  const collectionNft = await createCollectionNft(mx);

  // When we create a new Candy Machine with minimum configuration.
  const { candyMachine, candyMachineSigner } = await mx.candyMachines().create({
    itemsAvailable: toBigNumber(5000),
    sellerFeeBasisPoints: 333, // 3.33%
    collection: {
      address: collectionNft.address,
      updateAuthority: mx.identity(),
    },
  });

  // Then the following data was set on the Candy Machine account.
  const candyGuardAddress = mx
    .candyMachines()
    .pdas()
    .candyGuard({ base: candyMachineSigner.publicKey });
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    accountInfo: {
      owner: spokSamePubkey(candyMachineProgram.address),
    },
    address: spokSamePubkey(candyMachineSigner.publicKey),
    authorityAddress: spokSamePubkey(mx.identity().publicKey),
    mintAuthorityAddress: spokSamePubkey(candyGuardAddress),
    collectionMintAddress: spokSamePubkey(collectionNft.address),
    symbol: '',
    sellerFeeBasisPoints: 333,
    isMutable: true,
    maxEditionSupply: spokSameBignum(0),
    creators: [
      {
        address: spokSamePubkey(mx.identity().publicKey),
        share: 100,
      },
    ],
    items: [],
    itemsAvailable: spokSameBignum(5000),
    itemsMinted: spokSameBignum(0),
    itemsRemaining: spokSameBignum(5000),
    itemsLoaded: 0,
    isFullyLoaded: false,
    itemSettings: {
      type: 'configLines',
      prefixName: '',
      nameLength: 32,
      prefixUri: '',
      uriLength: 200,
      isSequential: false,
    },
    candyGuard: {
      model: 'candyGuard',
      accountInfo: {
        owner: spokSamePubkey(defaultCandyGuardProgram.address),
      },
      address: spokSamePubkey(candyGuardAddress),
      baseAddress: spokSamePubkey(candyMachineSigner.publicKey),
      authorityAddress: spokSamePubkey(mx.identity().publicKey),
      guards: emptyDefaultCandyGuardSettings,
      groups: [],
    },
  } as unknown as Specifications<CandyMachine>);
  t.equal(candyMachine.featureFlags.length, 64);
  t.ok(candyMachine.featureFlags.slice(0, 64).every((enabled) => !enabled));
});

test('[candyMachineModule] create candy machine with maximum configuration', async (t) => {
  // Given an existing Collection NFT.
  const mx = await metaplex();
  const collectionUpdateAuthority = await createWallet(mx);
  const collectionNft = await createCollectionNft(mx, {
    updateAuthority: collectionUpdateAuthority,
  });

  // When we create a new Candy Machine with maximum configuration.
  const candyMachineSigner = Keypair.generate();
  const payer = await createWallet(mx);
  const authority = Keypair.generate();
  const creatorA = Keypair.generate().publicKey;
  const creatorB = Keypair.generate().publicKey;
  const treasury = Keypair.generate().publicKey;
  const { candyMachine } = await mx.candyMachines().create(
    {
      candyMachine: candyMachineSigner,
      authority,
      collection: {
        address: collectionNft.address,
        updateAuthority: collectionUpdateAuthority,
      },
      sellerFeeBasisPoints: 333, // 3.33%
      itemsAvailable: toBigNumber(5000),
      itemSettings: {
        type: 'configLines',
        prefixName: 'My NFT Drop #$ID+1$',
        nameLength: 0,
        prefixUri: 'https://arweave.net/',
        uriLength: 50,
        isSequential: true,
      },
      symbol: 'MYNFT',
      maxEditionSupply: toBigNumber(1),
      isMutable: false,
      creators: [
        { address: creatorA, share: 50 },
        { address: creatorB, share: 50 },
      ],
      guards: {
        botTax: { lamports: sol(0.01), lastInstruction: false },
        solPayment: { amount: sol(1.5), destination: treasury },
      },
      groups: [
        {
          label: 'GROUP1',
          guards: { startDate: { date: toDateTime('2022-09-09T16:00:00Z') } },
        },
        {
          label: 'GROUP2',
          guards: { startDate: { date: toDateTime('2022-09-09T18:00:00Z') } },
        },
        {
          label: 'GROUP3',
          guards: { startDate: { date: toDateTime('2022-09-09T20:00:00Z') } },
        },
      ],
      withoutCandyGuard: false,
    },
    { payer }
  );

  // Then the following data was set on the Candy Machine account.
  const candyGuardAddress = mx
    .candyMachines()
    .pdas()
    .candyGuard({ base: candyMachineSigner.publicKey });
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    address: spokSamePubkey(candyMachineSigner.publicKey),
    authorityAddress: spokSamePubkey(authority.publicKey),
    mintAuthorityAddress: spokSamePubkey(candyGuardAddress),
    collectionMintAddress: spokSamePubkey(collectionNft.address),
    symbol: 'MYNFT',
    sellerFeeBasisPoints: 333,
    isMutable: false,
    maxEditionSupply: spokSameBignum(1),
    creators: [
      { address: spokSamePubkey(creatorA), share: 50 },
      { address: spokSamePubkey(creatorB), share: 50 },
    ],
    items: [],
    itemsAvailable: spokSameBignum(5000),
    itemsMinted: spokSameBignum(0),
    itemsRemaining: spokSameBignum(5000),
    itemsLoaded: 0,
    isFullyLoaded: false,
    itemSettings: {
      type: 'configLines',
      prefixName: 'My NFT Drop #$ID+1$',
      nameLength: 0,
      prefixUri: 'https://arweave.net/',
      uriLength: 50,
      isSequential: true,
    },
    candyGuard: {
      model: 'candyGuard',
      address: spokSamePubkey(candyGuardAddress),
      baseAddress: spokSamePubkey(candyMachineSigner.publicKey),
      authorityAddress: spokSamePubkey(authority.publicKey),
      guards: {
        ...emptyDefaultCandyGuardSettings,
        botTax: {
          lamports: spokSameAmount(sol(0.01)),
          lastInstruction: false,
        },
        solPayment: {
          amount: spokSameAmount(sol(1.5)),
          destination: spokSamePubkey(treasury),
        },
      },
      groups: [
        {
          label: 'GROUP1',
          guards: {
            startDate: {
              date: spokSameBignum(toDateTime('2022-09-09T16:00:00Z')),
            },
          },
        },
        {
          label: 'GROUP2',
          guards: {
            startDate: {
              date: spokSameBignum(toDateTime('2022-09-09T18:00:00Z')),
            },
          },
        },
        {
          label: 'GROUP3',
          guards: {
            startDate: {
              date: spokSameBignum(toDateTime('2022-09-09T20:00:00Z')),
            },
          },
        },
      ],
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it fails to wrap a Candy Guard if the authority is provided as a public key', async (t) => {
  // Given an existing Collection NFT.
  const mx = await metaplex();
  const collectionNft = await createCollectionNft(mx);

  // When we create a new Candy Machine with a Candy Guard
  // whilst passing the authority as a Public Key.
  const promise = mx.candyMachines().create({
    authority: Keypair.generate().publicKey,
    itemsAvailable: toBigNumber(5000),
    sellerFeeBasisPoints: 333, // 3.33%
    collection: {
      address: collectionNft.address,
      updateAuthority: mx.identity(),
    },
  });

  // Then we expect an error to be thrown.
  await assertThrows(
    t,
    promise,
    /Expected variable \[authority\] to be of type \[Signer\] but got \[PublicKey\]/
  );
});

test('[candyMachineModule] create candy machine without a candy guard', async (t) => {
  // Given an existing Collection NFT.
  const mx = await metaplex();
  const collectionNft = await createCollectionNft(mx);

  // When we create a new Candy Machine without a Candy Guard.
  const { candyMachine } = await mx.candyMachines().create({
    withoutCandyGuard: true,
    itemsAvailable: toBigNumber(5000),
    sellerFeeBasisPoints: 333, // 3.33%
    collection: {
      address: collectionNft.address,
      updateAuthority: mx.identity(),
    },
  });

  // Then the Candy Machine has no associated Candy Guard account
  // And its mint authority is the Candy Machine authority.
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    mintAuthorityAddress: spokSamePubkey(candyMachine.authorityAddress),
    candyGuard: null,
  });
});

test('[candyMachineModule] create candy machine with hidden settings', async (t) => {
  // Given an existing Collection NFT.
  const mx = await metaplex();
  const collectionNft = await createCollectionNft(mx);

  // When we create a new Candy Machine with hidden settings.
  const hash = create32BitsHash('some-file');
  const { candyMachine } = await mx.candyMachines().create({
    itemsAvailable: toBigNumber(5000),
    sellerFeeBasisPoints: 333, // 3.33%
    collection: {
      address: collectionNft.address,
      updateAuthority: mx.identity(),
    },
    itemSettings: {
      type: 'hidden',
      name: 'My NFT Drop #$ID+1$',
      uri: 'https://my-server.com/nft/$ID+1$.json',
      hash,
    },
  });

  // Then the following data was set on the Candy Machine account.
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    itemSettings: {
      type: 'hidden',
      name: 'My NFT Drop #$ID+1$',
      uri: 'https://my-server.com/nft/$ID+1$.json',
      hash,
    },
    items: [],
    itemsAvailable: spokSameBignum(5000),
    itemsMinted: spokSameBignum(0),
    itemsRemaining: spokSameBignum(5000),
    itemsLoaded: 0,
    isFullyLoaded: true,
  } as unknown as Specifications<CandyMachine>);
});
