import test from 'tape';
import spok, { Specifications } from 'spok';
import { Keypair } from '@solana/web3.js';
import {
  amman,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
} from '../../helpers';
import { sol, CandyMachine } from '@/index';
import { getCandyMachineUuidFromAddress } from '@/plugins/candyMachineModule/helpers';

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
    model: 'candyMachine',
    authorityAddress: mx.identity().publicKey,
    walletAddress: mx.identity().publicKey,
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

// // -----------------
// // End Settings
// // -----------------
// test('candyMachine: init with end settings - amount', async (t) => {
//   // Given we configure a Candy Machine
//   const { tc, cm, minimalConfig, opts } = await init();

//   const config: CandyMachineConfigWithoutStorage = {
//     ...minimalConfig,
//     endSettings: { endSettingType: 'amount', value: 100 },
//   };

//   // When we create that Candy Machine
//   const { transactionId, candyMachine, candyMachineSigner, ...rest } =
//     await cm.createFromConfig(config, opts);
//   await amman.addr.addLabel('tx: create candy-machine', transactionId);
//   await amman.addr.addLabel('candy-machine', candyMachineSigner.publicKey);

//   // Then we created the Candy Machine as configured
//   await tc.assertSuccess(t, transactionId);
//   assertProperlyInitialized(t, candyMachine, {
//     ...rest,
//     ...config,
//     candyMachineSigner,
//     tokenMintAddress: null,
//   });
//   spok(t, candyMachine.endSettings, {
//     $topic: 'end settings',
//     endSettingType: EndSettingType.Amount,
//     number: spokSameBignum(
//       new Date(config.endSettings?.value! as number).valueOf()
//     ),
//   });
// });

// test('candyMachine: init with end settings - date', async (t) => {
//   // Given we configure a Candy Machine
//   const { tc, cm, minimalConfig, opts } = await init();

//   const config: CandyMachineConfigWithoutStorage = {
//     ...minimalConfig,
//     endSettings: { endSettingType: 'date', value: '25 Jan 2022 00:00:00 GMT' },
//   };

//   // When we create that Candy Machine
//   const { transactionId, candyMachine, candyMachineSigner, ...rest } =
//     await cm.createFromConfig(config, opts);
//   await amman.addr.addLabel('tx: create candy-machine', transactionId);
//   await amman.addr.addLabel('candy-machine', candyMachineSigner.publicKey);

//   // Then we created the Candy Machine as configured
//   await tc.assertSuccess(t, transactionId);
//   assertProperlyInitialized(t, candyMachine, {
//     ...rest,
//     ...config,
//     candyMachineSigner,
//     tokenMintAddress: null,
//   });
//   spok(t, candyMachine.endSettings, {
//     $topic: 'end settings',
//     endSettingType: EndSettingType.Date,
//     number: spokSameBignum(
//       new Date(config.endSettings?.value! as string).valueOf()
//     ),
//   });
// });

// // -----------------
// // Hidden Settings
// // -----------------
// test('candyMachine: init with invalid hidden settings (hash too short)', async (t) => {
//   // Given we configure a Candy Machine incorrectly
//   const { cm, minimalConfig, opts } = await init();

//   const config: CandyMachineConfigWithoutStorage = {
//     ...minimalConfig,
//     hiddenSettings: {
//       hash: 'not 32-bit',
//       uri: 'https://example.com',
//       name: 'mint-name',
//     },
//   };

//   // When we create that Candy Machine it fails
//   await assertThrows(
//     t,
//     () => cm.createFromConfig(config, opts),
//     /len.+10.+should match len.+32/i
//   );
// });

// test.skip('candyMachine: init with invalid hidden settings program error', async (t) => {
//   // TODO(thlorenz): most likely due to incorrect account sizing when allocating candy machine,
//   // Program log: panicked at 'index out of bounds: the len is 713 but the index is 3117', src/lib.rs:697:13
//   // see: src/modules/candy-machine/models/candyMachineSpace.ts
//   const { tc, cm, minimalConfig, opts } = await init();

//   const config: CandyMachineConfigWithoutStorage = {
//     ...minimalConfig,
//     hiddenSettings: {
//       hash: hash32Bit('cache-file..'),
//       uri: 'https://example.com',
//       name: 'mint-name',
//     },
//   };

//   // When we create that Candy Machine
//   const { transactionId, candyMachine, ...rest } = await cm.createFromConfig(
//     config,
//     opts
//   );
//   await amman.addr.addLabel('initCandyMachine', transactionId);

//   // Then we created the Candy Machine as configured
//   await tc.assertSuccess(t, transactionId);
//   assertProperlyInitialized(t, candyMachine, {
//     ...rest,
//     ...config,
//     tokenMintAddress: null,
//   });
// });

// // -----------------
// // Gatekeeper Settings
// // -----------------
// test('candyMachine: with gatekeeper settings', async (t) => {
//   // Given we configure a Candy Machine
//   const [gateKeeper] = amman.genKeypair();

//   const { tc, cm, minimalConfig, opts } = await init();

//   const config: CandyMachineConfigWithoutStorage = {
//     ...minimalConfig,
//     gatekeeper: { expireOnUse: true, gatekeeperNetwork: gateKeeper.toBase58() },
//   };

//   // When we create that Candy Machine
//   const { transactionId, candyMachine, candyMachineSigner, ...rest } =
//     await cm.createFromConfig(config, opts);
//   await amman.addr.addLabel('tx: create candy-machine', transactionId);
//   await amman.addr.addLabel('candy-machine', candyMachineSigner.publicKey);

//   // Then we created the Candy Machine as configured
//   await tc.assertSuccess(t, transactionId);
//   assertProperlyInitialized(t, candyMachine, {
//     ...rest,
//     ...config,
//     candyMachineSigner,
//     tokenMintAddress: null,
//   });
//   spok(t, candyMachine.gatekeeper as GatekeeperConfig, {
//     $topic: 'gatekeeper',
//     expireOnUse: config.gatekeeper?.expireOnUse,
//     gatekeeperNetwork: spokSamePubkey(config.gatekeeper?.gatekeeperNetwork),
//   });
// });

// test('candyMachine: with invalid gatekeeper settings (network not a public key)', async (t) => {
//   // Given we configure a Candy Machine incorrectly
//   const { cm, minimalConfig, opts } = await init();

//   const config: CandyMachineConfigWithoutStorage = {
//     ...minimalConfig,
//     gatekeeper: { expireOnUse: true, gatekeeperNetwork: '<invalid>' },
//   };

//   // When we create that Candy Machine it fails
//   await assertThrows(
//     t,
//     () => cm.createFromConfig(config, opts),
//     /not a valid PublicKey/i
//   );
// });

// // -----------------
// // WhitelistMint Settings
// // -----------------
// test('candyMachine: with whitelistMint settings', async (t) => {
//   // Given we configure a Candy Machine
//   const [mint] = amman.genKeypair();

//   const { tc, cm, minimalConfig, opts } = await init();

//   const config: CandyMachineConfigWithoutStorage = {
//     ...minimalConfig,
//     whitelistMintSettings: {
//       mode: 'burnEveryTime',
//       discountPrice: 5,
//       mint: mint.toBase58(),
//       presale: false,
//     },
//   };

//   // When we create that Candy Machine
//   const { response, candyMachine, ...rest } = await cm.createFromConfig(
//     config,
//     opts
//   );
//   await amman.addr.addLabel('tx: create candy-machine', response.signature);
//   await amman.addr.addLabel('candy-machine', candyMachine.publicKey);

//   // Then we created the Candy Machine as configured
//   await tc.assertSuccess(t, response.signature);
//   assertProperlyInitialized(t, candyMachine, {
//     ...rest,
//     ...config,
//     candyMachineSigner,
//     tokenMintAddress: null,
//   });
//   spok(t, candyMachine.whitelistMintSettings as WhitelistMintSettings, {
//     $topic: 'whitelist mint settings',
//     mode: WhitelistMintMode.BurnEveryTime,
//     discountPrice: spokSameBignum(config.whitelistMintSettings?.discountPrice!),
//     mint: spokSamePubkey(config.whitelistMintSettings?.mint!),
//     presale: config.whitelistMintSettings?.presale,
//   });
// });

// test('candyMachine: with invalid whitemint settings (mint not a public key)', async (t) => {
//   // Given we configure a Candy Machine incorrectly
//   const { cm, minimalConfig, opts } = await init();

//   const config: CandyMachineConfigWithoutStorage = {
//     ...minimalConfig,
//     whitelistMintSettings: {
//       mode: 'burnEveryTime',
//       discountPrice: 5,
//       mint: '<invalid mint key>',
//       presale: false,
//     },
//   };

//   // When we create that Candy Machine it fails
//   await assertThrows(
//     t,
//     () => cm.createFromConfig(config, opts),
//     /not a valid PublicKey/i
//   );
// });
