import test from 'tape';
import spok, { Specifications } from 'spok';
import { Keypair } from '@solana/web3.js';
import {
  EndSettingType,
  WhitelistMintMode,
} from '@metaplex-foundation/mpl-candy-machine';
import {
  amman,
  assertThrows,
  createNft,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import {
  sol,
  CandyMachine,
  CreateCandyMachineInput,
  toBigNumber,
  toDateTime,
} from '@/index';
import { getCandyMachineUuidFromAddress } from '@/plugins/candyMachineModule/helpers';
import { create32BitsHash, create32BitsHashString } from './helpers';

killStuckProcess();

async function init() {
  const mx = await metaplex();
  const tc = amman.transactionChecker(mx.connection);
  const client = mx.candyMachines();
  const minimalInput: CreateCandyMachineInput = {
    price: sol(1),
    sellerFeeBasisPoints: 500,
    itemsAvailable: toBigNumber(100),
  };

  return { mx, tc, client, minimalInput };
}

test('[candyMachineModule] create with minimal input', async (t) => {
  // Given a Candy Machine client.
  const { tc, mx, client } = await init();

  // When we create that Candy Machine
  const { response, candyMachine } = await client
    .create({
      price: sol(1.25),
      sellerFeeBasisPoints: 500,
      itemsAvailable: toBigNumber(100),
    })
    .run();

  // Then we created the Candy Machine as configured
  await tc.assertSuccess(t, response.signature);
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    tokenMintAddress: null,
    uuid: getCandyMachineUuidFromAddress(candyMachine.address),
    price: spokSameAmount(sol(1.25)),
    symbol: '',
    sellerFeeBasisPoints: 500,
    isMutable: true,
    retainAuthority: true,
    goLiveDate: null,
    maxEditionSupply: spokSameBignum(0),
    items: [],
    itemsAvailable: spokSameBignum(100),
    itemsMinted: spokSameBignum(0),
    itemsRemaining: spokSameBignum(100),
    itemsLoaded: spokSameBignum(0),
    isFullyLoaded: false,
    endSettings: null,
    hiddenSettings: null,
    whitelistMintSettings: null,
    gatekeeper: null,
    creators: [
      {
        address: mx.identity().publicKey,
        verified: false,
        share: 100,
      },
    ],
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] create with creators', async (t) => {
  // Given a Candy Machine client and two creators.
  const { tc, client, minimalInput } = await init();
  const creatorA = Keypair.generate();
  const creatorB = Keypair.generate();
  const creators = [
    {
      address: creatorA.publicKey,
      verified: false,
      share: 50,
    },
    {
      address: creatorB.publicKey,
      verified: false,
      share: 50,
    },
  ];

  // When we create a Candy Machine and assign these creators.
  const { response, candyMachine } = await client
    .create({ ...minimalInput, creators })
    .run();

  // Then the creators where saved on the Candy Machine.
  await tc.assertSuccess(t, response.signature);
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    creators,
  });
});

test('[candyMachineModule] create with SPL treasury', async (t) => {
  // Given a Candy Machine client.
  const { tc, mx, client, minimalInput } = await init();

  // And a token account and its mint account.
  const { token } = await mx.tokens().createTokenWithMint().run();

  // When we create a Candy Machine with an SPL treasury.
  const { response, candyMachine } = await client
    .create({
      ...minimalInput,
      wallet: token.address,
      tokenMint: token.mint.address,
    })
    .run();

  // Then a Candy Machine was created with the SPL treasury as configured.
  await tc.assertSuccess(t, response.signature);
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    walletAddress: spokSamePubkey(token.address),
    tokenMintAddress: spokSamePubkey(token.mint.address),
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] create with end settings', async (t) => {
  // Given a Candy Machine client.
  const { tc, client, minimalInput } = await init();

  // When we create a Candy Machine with end settings.
  const { response, candyMachine } = await client
    .create({
      ...minimalInput,
      endSettings: {
        endSettingType: EndSettingType.Amount,
        number: toBigNumber(100),
      },
    })
    .run();

  // Then a Candy Machine was created with these end settings.
  await tc.assertSuccess(t, response.signature);
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    endSettings: {
      endSettingType: EndSettingType.Amount,
      number: spokSameBignum(100),
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] create with hidden settings', async (t) => {
  // Given a Candy Machine client and a computed hash.
  const { tc, client, minimalInput } = await init();

  // When we create a Candy Machine with hidden settings.
  const { response, candyMachine } = await client
    .create({
      ...minimalInput,
      hiddenSettings: {
        hash: create32BitsHash('cache-file'),
        uri: 'https://example.com',
        name: 'mint-name',
      },
    })
    .run();

  // Then a Candy Machine was created with these hidden settings.
  await tc.assertSuccess(t, response.signature);
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    hiddenSettings: {
      hash: create32BitsHash('cache-file'),
      uri: 'https://example.com',
      name: 'mint-name',
    },
  });
});

test('[candyMachineModule] try to create with invalid hidden settings', async (t) => {
  // Given a Candy Machine client.
  const { client, minimalInput } = await init();

  // When we create a Candy Machine with invalid hidden settings.
  const promise = client
    .create({
      ...minimalInput,
      hiddenSettings: {
        hash: [1, 2, 3], // <- Should be 32 bytes.
        uri: 'https://example.com',
        name: 'mint-name',
      },
    })
    .run();

  // Then it fails to create the Candy Machine.
  await assertThrows(t, promise, /len.+3.+should match len.+32/i);
});

test('[candyMachineModule] create with gatekeeper settings', async (t) => {
  // Given a Candy Machine client and a gatekeeper address.
  const { tc, client, minimalInput } = await init();
  const gatekeeper = Keypair.generate();

  // When we create a Candy Machine with gatekeep settings.
  const { response, candyMachine } = await client
    .create({
      ...minimalInput,
      gatekeeper: {
        network: gatekeeper.publicKey,
        expireOnUse: true,
      },
    })
    .run();

  // Then a Candy Machine was created with these gatekeep settings.
  await tc.assertSuccess(t, response.signature);
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    gatekeeper: {
      network: gatekeeper.publicKey,
      expireOnUse: true,
    },
  });
});

test('[candyMachineModule] create with whitelistMint settings', async (t) => {
  // Given a Candy Machine client and a mint account.
  const { tc, client, minimalInput } = await init();
  const mint = Keypair.generate();

  // When we create a Candy Machine with ...
  const { response, candyMachine } = await client
    .create({
      ...minimalInput,
      whitelistMintSettings: {
        mode: WhitelistMintMode.BurnEveryTime,
        discountPrice: sol(0.5),
        mint: mint.publicKey,
        presale: false,
      },
    })
    .run();

  // Then a Candy Machine was created with ...
  await tc.assertSuccess(t, response.signature);
  console.log(candyMachine.whitelistMintSettings?.discountPrice);
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    price: spokSameAmount(sol(1)),
    whitelistMintSettings: {
      mode: WhitelistMintMode.BurnEveryTime,
      discountPrice: spokSameAmount(sol(0.5)),
      mint: mint.publicKey,
      presale: false,
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] create using JSON configurations', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Candy Machine using JSON configurations.
  const solTreasuryAccount = Keypair.generate().publicKey;
  const whitelistMint = Keypair.generate().publicKey;
  const gateKeeper = Keypair.generate().publicKey;
  const { candyMachine } = await mx
    .candyMachines()
    .createFromJsonConfig({
      json: {
        price: 1.5,
        number: 42,
        sellerFeeBasisPoints: 200,
        solTreasuryAccount: solTreasuryAccount.toBase58(),
        goLiveDate: '4 Jul 2022 00:00:00 GMT',
        noRetainAuthority: true,
        noMutable: true,
        maxEditionSupply: 10,
        creators: undefined, // Should default to solTreasuryAccount.
        symbol: 'CANDY',
        splTokenAccount: undefined,
        splToken: undefined,
        gatekeeper: {
          expireOnUse: true,
          gatekeeperNetwork: gateKeeper.toBase58(),
        },
        endSettings: {
          endSettingType: 'date',
          value: '4 Aug 2022 00:00:00 GMT',
        },
        whitelistMintSettings: {
          mode: 'burnEveryTime',
          discountPrice: 0.5,
          mint: whitelistMint.toBase58(),
          presale: false,
        },
        hiddenSettings: {
          hash: create32BitsHashString('cache-file'),
          uri: 'https://example.com',
          name: 'mint-name',
        },
      },
    })
    .run();

  // Then we created the Candy Machine as configured.
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    tokenMintAddress: null,
    uuid: getCandyMachineUuidFromAddress(candyMachine.address),
    price: spokSameAmount(sol(1.5)),
    symbol: 'CANDY',
    sellerFeeBasisPoints: 200,
    isMutable: false,
    retainAuthority: false,
    goLiveDate: toDateTime('4 Jul 2022 00:00:00 GMT'),
    maxEditionSupply: spokSameBignum(10),
    items: [],
    itemsAvailable: spokSameBignum(42),
    itemsMinted: spokSameBignum(0),
    itemsRemaining: spokSameBignum(42),
    itemsLoaded: spokSameBignum(0),
    isFullyLoaded: false,
    endSettings: {
      endSettingType: EndSettingType.Date,
      date: spokSameBignum(toDateTime('4 Aug 2022 00:00:00 GMT')),
    },
    hiddenSettings: {
      hash: create32BitsHash('cache-file'),
      uri: 'https://example.com',
      name: 'mint-name',
    },
    whitelistMintSettings: {
      mode: WhitelistMintMode.BurnEveryTime,
      discountPrice: spokSameAmount(sol(0.5)),
      mint: spokSamePubkey(whitelistMint),
      presale: false,
    },
    gatekeeper: {
      expireOnUse: true,
      gatekeeperNetwork: spokSamePubkey(gateKeeper),
    },
    creators: [
      {
        address: solTreasuryAccount,
        verified: false,
        share: 100,
      },
    ],
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] create with SPL treasury using JSON configurations', async (t) => {
  // Given a Candy Machine client.
  const { tc, mx, client } = await init();

  // And a token account and its mint account.
  const { token } = await mx.tokens().createTokenWithMint().run();

  // When we create a new Candy Machine with an SPL treasury using JSON configurations.
  const solTreasuryAccount = Keypair.generate().publicKey;
  const { response, candyMachine } = await client
    .createFromJsonConfig({
      json: {
        price: 3.33,
        number: 100,
        sellerFeeBasisPoints: 500,
        solTreasuryAccount: solTreasuryAccount.toBase58(),
        goLiveDate: '4 Jul 2022 00:00:00 GMT',
        noRetainAuthority: false,
        noMutable: false,
        splTokenAccount: token.address.toBase58(),
        splToken: token.mint.address.toBase58(),
      },
    })
    .run();

  // Then a Candy Machine was created with the SPL treasury as configured.
  await tc.assertSuccess(t, response.signature);
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    walletAddress: spokSamePubkey(token.address),
    tokenMintAddress: spokSamePubkey(token.mint.address),
  } as unknown as Specifications<CandyMachine>);
});

test.only('[candyMachineModule] create with collection', async (t) => {
  // Given a Candy Machine client.
  const { mx, client, minimalInput } = await init();

  // And a Collection NFT.
  const collectionNft = await createNft(mx);

  // When we create that Candy Machine
  const { candyMachine } = await client
    .create({
      ...minimalInput,
      collection: collectionNft,
    })
    .run();

  // Then we created the Candy Machine as configured
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    collection: collectionNft.mintAddress,
  } as unknown as Specifications<CandyMachine>);
});
