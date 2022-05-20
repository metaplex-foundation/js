import test from 'tape';
import spok from 'spok';
import {
  amman,
  killStuckProcess,
  metaplex,
  SKIP_PREFLIGHT,
} from '../../helpers';
import {
  CandyMachineCannotAddAmountError,
  CandyMachineConfigWithoutStorage,
  CandyMachineIsFullError,
  Metaplex,
} from '../../../src';

killStuckProcess();

export async function createCandyMachine(mx: Metaplex, number: number) {
  const payer = mx.identity();

  const solTreasurySigner = payer;
  await amman.airdrop(mx.connection, solTreasurySigner.publicKey, 100);

  const config: CandyMachineConfigWithoutStorage = {
    price: 1.0,
    number,
    sellerFeeBasisPoints: 0,
    solTreasuryAccount: solTreasurySigner.publicKey.toBase58(),
    goLiveDate: '25 Dec 2021 00:00:00 GMT',
    retainAuthority: true,
    isMutable: false,
  };

  const opts = { confirmOptions: SKIP_PREFLIGHT };
  await amman.addr.addLabels({ ...config, payer });

  const cm = mx.candyMachines();
  const { transactionId, payerSigner, candyMachineSigner } =
    await cm.createFromConfig(config, opts);

  await amman.addr.addLabel(
    `candy-machine-holds-${number}`,
    candyMachineSigner.publicKey
  );
  await amman.addr.addLabel(
    `tx: create-cm holding ${number} assets`,
    transactionId
  );

  return {
    payerSigner,
    candyMachineSigner,
  };
}

test('addAssets: candy machine that can hold 7 assets', async (t) => {
  // Given I create a candy machine holing 7 assets
  const mx = await metaplex();
  const cm = mx.candyMachines();
  const tc = amman.transactionChecker(mx.connection);

  const { candyMachineSigner, payerSigner } = await createCandyMachine(mx, 7);

  {
    // When I add one asset
    t.comment('Adding one asset');
    const { transactionId } = await cm.addAssets({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      assets: [{ name: 'first asset', uri: 'first uri' }],
    });
    await amman.addr.addLabel('cm(7)-add first asset', transactionId);

    // Then the transaction succeeds
    await tc.assertSuccess(t, transactionId);

    // And the candy machine has the asset added
    const candyMachine = await mx
      .candyMachines()
      .findByAddress(candyMachineSigner.publicKey);

    spok(t, candyMachine, {
      assets: [
        {
          name: spok.startsWith('first asset'),
          uri: spok.startsWith('first uri'),
        },
      ],
    });
  }

  {
    // When I add two more assets
    t.comment('Adding two more assets');
    const { transactionId } = await cm.addAssets({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      assets: [
        { name: 'second asset', uri: 'second uri' },
        { name: 'third asset', uri: 'third uri' },
      ],
    });
    await amman.addr.addLabel('cm(7)-add two more assets', transactionId);

    // Then the transaction succeeds
    await tc.assertSuccess(t, transactionId);

    // And the candy machine has the assets added
    const candyMachine = await mx
      .candyMachines()
      .findByAddress(candyMachineSigner.publicKey);

    spok(t, candyMachine, {
      assets: [
        {
          name: spok.startsWith('first asset'),
          uri: spok.startsWith('first uri'),
        },
        {
          name: spok.startsWith('second asset'),
          uri: spok.startsWith('second uri'),
        },
        {
          name: spok.startsWith('third asset'),
          uri: spok.startsWith('third uri'),
        },
      ],
    });
  }

  {
    // When I add four more assets
    t.comment('Adding four more assets');
    const { transactionId } = await cm.addAssets({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      assets: [
        { name: 'fourth asset', uri: 'fourth uri' },
        { name: 'fifth asset', uri: 'fifth uri' },
        { name: 'sixth asset', uri: 'sixth uri' },
        { name: 'seventh asset', uri: 'seventh uri' },
      ],
    });
    await amman.addr.addLabel('cm(7)-add four more assets', transactionId);

    // Then the transaction succeeds
    await tc.assertSuccess(t, transactionId);

    // And the candy machine has the assets added
    const candyMachine = await mx
      .candyMachines()
      .findByAddress(candyMachineSigner.publicKey);

    spok(t, candyMachine, {
      assets: [
        {
          name: spok.startsWith('first asset'),
          uri: spok.startsWith('first uri'),
        },
        {
          name: spok.startsWith('second asset'),
          uri: spok.startsWith('second uri'),
        },
        {
          name: spok.startsWith('third asset'),
          uri: spok.startsWith('third uri'),
        },
        {
          name: spok.startsWith('fourth asset'),
          uri: spok.startsWith('fourth uri'),
        },
        {
          name: spok.startsWith('fifth asset'),
          uri: spok.startsWith('fifth uri'),
        },
        {
          name: spok.startsWith('sixth asset'),
          uri: spok.startsWith('sixth uri'),
        },
        {
          name: spok.startsWith('seventh asset'),
          uri: spok.startsWith('seventh uri'),
        },
      ],
    });
  }
});

test('addAssets: candy machine that can hold 0 assets adding one', async (t) => {
  // Given I create a candy machine holding 0
  const mx = await metaplex();
  const cm = mx.candyMachines();

  const { candyMachineSigner, payerSigner } = await createCandyMachine(mx, 0);

  // When I add one asset
  t.comment('Adding one asset');
  try {
    await cm.addAssets({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      assets: [{ name: 'first asset', uri: 'first uri' }],
    });
    t.fail('should have thrown');
  } catch (err) {
    // Then the request fails
    t.ok(
      err instanceof CandyMachineIsFullError,
      'throws CandyMachineIsFullError'
    );
  }
  // And the candy machine has no assets added
  const candyMachine = await mx
    .candyMachines()
    .findByAddress(candyMachineSigner.publicKey);

  t.equal(candyMachine?.assetsCount, 0, 'no assets added');
});

test('addAssets: candy machine that can hold 2 assets adding 5', async (t) => {
  // Given I create a candy machine holding 4
  const mx = await metaplex();
  const cm = mx.candyMachines();

  const { candyMachineSigner, payerSigner } = await createCandyMachine(mx, 4);

  // When I add five assets
  t.comment('Adding five assets');
  try {
    await cm.addAssets({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      assets: [
        { name: 'first asset', uri: 'first uri' },
        { name: 'second asset', uri: 'second uri' },
        { name: 'third asset', uri: 'third uri' },
        { name: 'fourth asset', uri: 'fourth uri' },
        { name: 'fifth asset', uri: 'fifth uri' },
      ],
    });
    t.fail('should have thrown');
  } catch (err) {
    t.ok(
      err instanceof CandyMachineCannotAddAmountError,
      'throws CandyMachineCannotAddAmountError'
    );
  }

  // And the candy machine has no assets added
  const candyMachine = await mx
    .candyMachines()
    .findByAddress(candyMachineSigner.publicKey);

  t.equal(candyMachine?.assetsCount, 0, 'no assets added');
});

test('addAssets: candy machine that can hold 4 assets adding 3 and then 2', async (t) => {
  // Given I create a candy machine holding 4
  const mx = await metaplex();
  const cm = mx.candyMachines();
  const tc = amman.transactionChecker(mx.connection);

  const { candyMachineSigner, payerSigner } = await createCandyMachine(mx, 4);

  {
    // When I add three assets
    t.comment('Adding three assets');
    const { transactionId } = await cm.addAssets({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      assets: [
        { name: 'first asset', uri: 'first uri' },
        { name: 'second asset', uri: 'second uri' },
        { name: 'third asset', uri: 'third uri' },
      ],
    });
    await amman.addr.addLabel('cm(4)-add-three', transactionId);
    tc.assertSuccess(t, transactionId);
  }

  //
  // And then I add two more assets
  t.comment('Adding two more assets');
  try {
    await cm.addAssets({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      assets: [
        { name: 'fourth asset', uri: 'fourth uri' },
        { name: 'fifth asset', uri: 'fifth uri' },
      ],
    });
    t.fail('should have thrown');
  } catch (err) {
    t.ok(
      err instanceof CandyMachineCannotAddAmountError,
      'throws CandyMachineCannotAddAmountError'
    );
  }

  // And the candy machine has only the first three assets added
  const candyMachine = await mx
    .candyMachines()
    .findByAddress(candyMachineSigner.publicKey);

  t.equal(candyMachine?.assetsCount, 3, 'first three assets added');
});

test('addAssets: candy machine that can hold 3 assets adding 3 and then 2', async (t) => {
  // Given I create a candy machine holding 3
  const mx = await metaplex();
  const cm = mx.candyMachines();
  const tc = amman.transactionChecker(mx.connection);

  const { candyMachineSigner, payerSigner } = await createCandyMachine(mx, 3);

  {
    // When I add three assets
    t.comment('Adding three assets');
    const { transactionId } = await cm.addAssets({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      assets: [
        { name: 'first asset', uri: 'first uri' },
        { name: 'second asset', uri: 'second uri' },
        { name: 'third asset', uri: 'third uri' },
      ],
    });
    await amman.addr.addLabel('cm(3)-add-three', transactionId);
    tc.assertSuccess(t, transactionId);
  }

  //
  // And then I add two more assets
  t.comment('Adding two more assets');
  try {
    await cm.addAssets({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      assets: [
        { name: 'fourth asset', uri: 'fourth uri' },
        { name: 'fifth asset', uri: 'fifth uri' },
      ],
    });
    t.fail('should have thrown');
  } catch (err) {
    t.ok(
      err instanceof CandyMachineIsFullError,
      'throws CandyMachineIsFullError'
    );
  }

  // And the candy machine has only the first three assets added
  const candyMachine = await mx
    .candyMachines()
    .findByAddress(candyMachineSigner.publicKey);

  t.equal(candyMachine?.assetsCount, 3, 'first three assets added');
});
