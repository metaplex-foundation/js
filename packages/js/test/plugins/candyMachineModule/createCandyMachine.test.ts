import {
  CandyMachine,
  CandyMachineProgram,
  DefaultCandyGuardProgram,
  emptyDefaultCandyGuardSettings,
  findCandyGuardPda,
  sol,
  toBigNumber,
  toDateTime,
} from '@/index';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test from 'tape';
import {
  createCollectionNft,
  createWallet,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';

killStuckProcess();

test('[candyMachineModule] create with minimum configuration', async (t) => {
  // Given an existing Collection NFT.
  const mx = await metaplex();
  const collectionNft = await createCollectionNft(mx);

  // When we create a new Candy Machine with minimum configuration.
  const { candyMachine, candyMachineSigner } = await mx
    .candyMachines()
    .create({
      itemsAvailable: toBigNumber(5000),
      sellerFeeBasisPoints: 333, // 3.33%
      collection: {
        address: collectionNft.address,
        updateAuthority: mx.identity(),
      },
    })
    .run();

  // Then the following data was set on the Candy Machine account.
  const candyGuardAddress = findCandyGuardPda(candyMachineSigner.publicKey);
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    accountInfo: {
      owner: spokSamePubkey(CandyMachineProgram.address),
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
        owner: spokSamePubkey(DefaultCandyGuardProgram.address),
      },
      address: spokSamePubkey(candyGuardAddress),
      baseAddress: spokSamePubkey(candyMachineSigner.publicKey),
      authorityAddress: spokSamePubkey(mx.identity().publicKey),
      guards: emptyDefaultCandyGuardSettings,
      groups: [],
    },
  } as unknown as Specifications<CandyMachine>);
  t.equal(candyMachine.itemsLoadedMap.length, 5000);
  t.ok(candyMachine.itemsLoadedMap.every((loaded) => !loaded));
  t.equal(candyMachine.featureFlags.length, 64);
  t.ok(candyMachine.featureFlags.slice(0, 64).every((enabled) => !enabled));
});

test('[candyMachineModule] create with maximum configuration', async (t) => {
  // Given an existing Collection NFT.
  const mx = await metaplex();
  const collectionUpdateAuthority = await createWallet(mx);
  const collectionNft = await createCollectionNft(mx, {
    updateAuthority: collectionUpdateAuthority,
  });

  // When we create a new Candy Machine with maximum configuration.
  const candyMachineSigner = Keypair.generate();
  const payer = await createWallet(mx);
  const authority = Keypair.generate().publicKey;
  const creatorA = Keypair.generate().publicKey;
  const creatorB = Keypair.generate().publicKey;
  const treasury = Keypair.generate().publicKey;
  const { candyMachine } = await mx
    .candyMachines()
    .create({
      candyMachine: candyMachineSigner,
      payer,
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
        lamports: { amount: sol(1.5), destination: treasury },
      },
      groups: [
        { liveDate: { date: toDateTime('2022-09-09T16:00:00Z') } },
        { liveDate: { date: toDateTime('2022-09-09T18:00:00Z') } },
        { liveDate: { date: toDateTime('2022-09-09T20:00:00Z') } },
      ],
      withoutCandyGuard: false,
    })
    .run();

  // Then the following data was set on the Candy Machine account.
  const candyGuardAddress = findCandyGuardPda(candyMachineSigner.publicKey);
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    address: spokSamePubkey(candyMachineSigner.publicKey),
    authorityAddress: spokSamePubkey(authority),
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
      authorityAddress: spokSamePubkey(authority),
      guards: {
        ...emptyDefaultCandyGuardSettings,
        botTax: {
          lamports: spokSameAmount(sol(0.01)),
          lastInstruction: false,
        },
        lamports: {
          amount: spokSameAmount(sol(1.5)),
          destination: spokSamePubkey(treasury),
        },
      },
      groups: [
        {
          liveDate: {
            date: spokSameBignum(toDateTime('2022-09-09T16:00:00Z')),
          },
        },
        {
          liveDate: {
            date: spokSameBignum(toDateTime('2022-09-09T18:00:00Z')),
          },
        },
        {
          liveDate: {
            date: spokSameBignum(toDateTime('2022-09-09T20:00:00Z')),
          },
        },
      ],
    },
  } as unknown as Specifications<CandyMachine>);
});

test.skip('[candyMachineModule] create without a candy guard', async (t) => {
  //
});

test.skip('[candyMachineModule] create with hidden settings', async (t) => {
  //
});
