import test from 'tape';
import spok, { Specifications } from 'spok';
import { Keypair } from '@solana/web3.js';
import {
  amman,
  assertThrows,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
} from '../../helpers';
import { sol, CandyMachine } from '@/index';
import { getCandyMachineUuidFromAddress } from '@/plugins/candyMachineModule/helpers';
import {
  EndSettingType,
  WhitelistMintMode,
} from '@metaplex-foundation/mpl-candy-machine';
import nacl from 'tweetnacl';

killStuckProcess();

async function init() {
  const mx = await metaplex();
  const tc = amman.transactionChecker(mx.connection);
  const client = mx.candyMachines();
  const minimalInput = {
    price: sol(1),
    sellerFeeBasisPoints: 500,
    itemsAvailable: 100,
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
      itemsAvailable: 100,
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
    itemsAvailable: 100,
    itemsMinted: 0,
    itemsRemaining: 100,
    itemsLoaded: 0,
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

test('[candyMachineModule] create with end settings', async (t) => {
  // Given a Candy Machine client.
  const { tc, client, minimalInput } = await init();

  // When we create a Candy Machine with end settings.
  const { response, candyMachine } = await client
    .create({
      ...minimalInput,
      endSettings: {
        endSettingType: EndSettingType.Amount,
        number: 100,
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
  const hashInput = 'cache-file';
  const hash = Array.from(nacl.hash(Buffer.from(hashInput)).slice(0, 32));

  // When we create a Candy Machine with hidden settings.
  const { response, candyMachine } = await client
    .create({
      ...minimalInput,
      hiddenSettings: {
        hash,
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
      hash,
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
  await assertThrows(t, promise, /len.+10.+should match len.+32/i);
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
        expireOnUse: true,
        gatekeeperNetwork: gatekeeper.publicKey,
      },
    })
    .run();

  // Then a Candy Machine was created with these gatekeep settings.
  await tc.assertSuccess(t, response.signature);
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    gatekeeper: {
      expireOnUse: true,
      gatekeeperNetwork: gatekeeper.publicKey,
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
