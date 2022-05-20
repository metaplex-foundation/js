import test from 'tape';
import spok from 'spok';
import {
  amman,
  killStuckProcess,
  metaplex,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import { createCandyMachineWithMinimalConfig } from './helpers';
import {
  CandyMachineData,
  EndSettingType,
  WhitelistMintMode,
} from '@metaplex-foundation/mpl-candy-machine';
import { CandyMachine } from '@/plugins';

killStuckProcess();

function assertProperlyUpdatedScalars(
  t: test.Test,
  createdCandyMachine: CandyMachine,
  updatedCandyMachine: CandyMachine,
  expectedChanges: Partial<Record<keyof CandyMachine, any>>
) {
  const expected: Partial<Record<keyof CandyMachine, any>> = {
    ...createdCandyMachine,
    ...expectedChanges,
  };

  spok(t, updatedCandyMachine, {
    uuid: expected.uuid,

    price: spokSameBignum(expected.price),
    symbol: expected.symbol,
    sellerFeeBasisPoints: expected.sellerFeeBasisPoints,

    maxSupply: spokSameBignum(expected.maxSupply),
    isMutable: expected.isMutable,
    retainAuthority: expected.retainAuthority,
    goLiveDate: spokSameBignum(expected.goLiveDate),
    itemsAvailable: expected.itemsAvailable,
  });
}

// -----------------
// Scalar Properties
// -----------------
type ValueOf<T> = T[keyof T];
test('update: candy machine single property', async (t) => {
  // Given I create one candy machine
  const mx = await metaplex();
  const cm = mx.candyMachines();
  const tc = amman.transactionChecker(mx.connection);

  const { candyMachineSigner, payerSigner, walletAddress, candyMachine } =
    await createCandyMachineWithMinimalConfig(mx);

  const changes: [keyof CandyMachineData, ValueOf<CandyMachineData>][] = [
    ['uuid', 'new-uuid'],
    ['price', 333],
    ['symbol', 'NEW'],
    ['sellerFeeBasisPoints', 555],
    ['isMutable', true],
    ['retainAuthority', false],
    ['goLiveDate', new Date('2022-02-02').valueOf()],
  ];

  let currentCandyMachine = candyMachine;
  for (const [key, value] of changes) {
    t.comment(`Updating ${key}`);

    // When I update that candy machine's property
    const { transactionId } = await cm.update({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      walletAddress,
      [key]: value,
    });
    await amman.addr.addLabel(`tx: update-cm-${key}`, transactionId);

    // Then the transaction succeeds
    await tc.assertSuccess(t, transactionId);

    // And the candy machine is updated
    const updatedMachine = await mx
      .candyMachines()
      .findByAddress(candyMachineSigner.publicKey);
    t.ok(updatedMachine != null, 'finds updated machine');
    assertProperlyUpdatedScalars(t, currentCandyMachine, updatedMachine!, {
      [key]: value,
    });
    currentCandyMachine = updatedMachine!;
  }
});

test('update: candy machine multiple scalar properties', async (t) => {
  // Given I create one candy machine
  const mx = await metaplex();
  const cm = mx.candyMachines();
  const tc = amman.transactionChecker(mx.connection);
  const { candyMachineSigner, payerSigner, walletAddress, candyMachine } =
    await createCandyMachineWithMinimalConfig(mx);

  const changes: [keyof CandyMachineData, ValueOf<CandyMachineData>][][] = [
    // first half
    [
      ['uuid', 'new-uuid'],
      ['price', 333],
      ['symbol', 'NEW'],
    ],
    // second half
    [
      ['sellerFeeBasisPoints', 555],
      ['isMutable', true],
      ['retainAuthority', false],
      ['goLiveDate', new Date('2022-02-02').valueOf()],
    ],

    // all
    [
      ['uuid', 'new-uuid'],
      ['price', 333],
      ['symbol', 'NEW'],
      ['sellerFeeBasisPoints', 555],
      ['isMutable', true],
      ['retainAuthority', false],
      ['goLiveDate', new Date('2022-02-02').valueOf()],
    ],
  ];

  let currentCandyMachine = candyMachine;
  for (const changeSet of changes) {
    const keys = changeSet.map(([key]) => key);
    const keyValues = changeSet.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<keyof CandyMachineData, ValueOf<CandyMachineData>>) as Partial<CandyMachineData>;

    t.comment(`Updating ${keys.join(', ')}`);

    // When I update that candy machine's property
    const { transactionId } = await cm.update({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      walletAddress,
      ...keyValues,
    });
    await amman.addr.addLabel(
      `tx: update-cm-${keys.join(', ')}`,
      transactionId
    );

    // Then the transaction succeeds
    await tc.assertSuccess(t, transactionId);

    // And the candy machine is updated
    const updatedMachine = await mx
      .candyMachines()
      .findByAddress(candyMachineSigner.publicKey);
    t.ok(updatedMachine != null, 'finds updated machine');

    const expectedChanges = changeSet.reduce((acc, [key, val]) => {
      (acc as Record<keyof CandyMachineData, ValueOf<CandyMachineData>>)[key] =
        val;
      return acc;
    }, {});
    assertProperlyUpdatedScalars(
      t,
      currentCandyMachine,
      updatedMachine!,
      expectedChanges
    );
    currentCandyMachine = updatedMachine!;
  }
});

// -----------------
// End Settings
// -----------------
test('update: candy machine end settings', async (t) => {
  // Given I create one candy machine without end settings
  const mx = await metaplex();
  const cm = mx.candyMachines();
  const tc = amman.transactionChecker(mx.connection);

  const { candyMachineSigner, payerSigner, walletAddress, candyMachine } =
    await createCandyMachineWithMinimalConfig(mx);

  {
    // When I add that candy machine's end settings
    t.comment('adding settings');
    const changes: Partial<CandyMachine> = {
      endSettings: {
        endSettingType: EndSettingType.Date,
        number: new Date('25 Jan 2022 00:00:00 GMT').valueOf(),
      },
    };

    const { transactionId } = await cm.update({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      walletAddress,
      ...changes,
    });
    await amman.addr.addLabel('tx: add-cm-end-settings', transactionId);

    // Then the transaction succeeds
    await tc.assertSuccess(t, transactionId);

    // And the candy machine is updated
    const updatedMachine = await mx
      .candyMachines()
      .findByAddress(candyMachineSigner.publicKey);

    // with scalar values unchanged
    assertProperlyUpdatedScalars(t, candyMachine, updatedMachine!, {});

    // and settings configured
    spok(t, updatedMachine?.endSettings, {
      endSettingType: changes.endSettings?.endSettingType,
      number: spokSameBignum(changes.endSettings?.number),
    });
  }

  {
    // When I then change the settings
    t.comment('changing settings');
    const changes: Partial<CandyMachine> = {
      endSettings: {
        endSettingType: EndSettingType.Date,
        number: new Date('25 Feb 2022 01:02:03 GMT').valueOf(),
      },
    };

    const { transactionId } = await cm.update({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      walletAddress,
      ...changes,
    });
    await amman.addr.addLabel('tx: update-cm-end-settings', transactionId);

    // Then the transaction succeeds
    await tc.assertSuccess(t, transactionId);

    // And the candy machine is updated
    const updatedMachine = await mx
      .candyMachines()
      .findByAddress(candyMachineSigner.publicKey);

    // with scalar values unchanged
    assertProperlyUpdatedScalars(t, candyMachine, updatedMachine!, {});

    // and settings re-configured
    spok(t, updatedMachine?.endSettings, {
      endSettingType: changes.endSettings?.endSettingType,
      number: spokSameBignum(changes.endSettings?.number),
    });
  }

  {
    // When I then remove the settings
    t.comment('removing settings');
    const changes: Partial<CandyMachine> = {
      endSettings: undefined,
    };

    const { transactionId } = await cm.update({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      walletAddress,
      ...changes,
    });
    await amman.addr.addLabel('tx: remove-cm-end-settings', transactionId);

    // Then the transaction succeeds
    await tc.assertSuccess(t, transactionId);

    // And the candy machine is updated
    const updatedMachine = await mx
      .candyMachines()
      .findByAddress(candyMachineSigner.publicKey);

    // with scalar values unchanged
    assertProperlyUpdatedScalars(t, candyMachine, updatedMachine!, {});

    // and settings removed
    t.ok(updatedMachine?.endSettings == null, 'end settings undefined');
  }
});

// -----------------
// Hidden Settings
// -----------------
// TODO(thlorenz): add these tests once the program correctly handles these settings

// -----------------
// Gatekeeper Settings
// -----------------
test('update: candy machine gatekeeper settings', async (t) => {
  // Given I create one candy machine without gatekeeper settings
  const mx = await metaplex();
  const cm = mx.candyMachines();
  const tc = amman.transactionChecker(mx.connection);

  const { candyMachineSigner, payerSigner, walletAddress, candyMachine } =
    await createCandyMachineWithMinimalConfig(mx);

  {
    const [gateKeeper] = await amman.genLabeledKeypair('added-gateKeeper');

    // When I add gatekeeper settings to that candy machine
    t.comment('adding settings');
    const changes: Partial<CandyMachine> = {
      gatekeeper: { expireOnUse: true, gatekeeperNetwork: gateKeeper },
    };

    const { transactionId } = await cm.update({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      walletAddress,
      ...changes,
    });
    await amman.addr.addLabel('tx: add-cm-gatekeeper-settings', transactionId);

    // Then the transaction succeeds
    await tc.assertSuccess(t, transactionId);

    // And the candy machine is updated
    const updatedMachine = await mx
      .candyMachines()
      .findByAddress(candyMachineSigner.publicKey);

    // with scalar values unchanged
    assertProperlyUpdatedScalars(t, candyMachine, updatedMachine!, {});

    // and settings configured
    spok(t, updatedMachine?.gatekeeper, {
      expireOnUse: changes.gatekeeper?.expireOnUse,
      gatekeeperNetwork: spokSamePubkey(changes.gatekeeper?.gatekeeperNetwork),
    });
  }

  {
    const [gateKeeper] = await amman.genLabeledKeypair('changed-gateKeeper');
    // When I then change the settings
    t.comment('changing settings');
    const changes: Partial<CandyMachine> = {
      gatekeeper: { expireOnUse: false, gatekeeperNetwork: gateKeeper },
    };

    const { transactionId } = await cm.update({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      walletAddress,
      ...changes,
    });
    await amman.addr.addLabel(
      'tx: update-cm-gatekeeper-settings',
      transactionId
    );

    // Then the transaction succeeds
    await tc.assertSuccess(t, transactionId);

    // And the candy machine is updated
    const updatedMachine = await mx
      .candyMachines()
      .findByAddress(candyMachineSigner.publicKey);

    // with scalar values unchanged
    assertProperlyUpdatedScalars(t, candyMachine, updatedMachine!, {});

    // and settings re-configured
    spok(t, updatedMachine?.gatekeeper, {
      expireOnUse: changes.gatekeeper?.expireOnUse,
      gatekeeperNetwork: spokSamePubkey(changes.gatekeeper?.gatekeeperNetwork),
    });
  }

  {
    // When I then remove the settings
    t.comment('removing settings');
    const changes: Partial<CandyMachine> = {
      gatekeeper: undefined,
    };

    const { transactionId } = await cm.update({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      walletAddress,
      ...changes,
    });
    await amman.addr.addLabel(
      'tx: remove-cm-gatekeeper-settings',
      transactionId
    );

    // Then the transaction succeeds
    await tc.assertSuccess(t, transactionId);

    // And the candy machine is updated
    const updatedMachine = await mx
      .candyMachines()
      .findByAddress(candyMachineSigner.publicKey);

    // with scalar values unchanged
    assertProperlyUpdatedScalars(t, candyMachine, updatedMachine!, {});

    // and settings removed
    t.ok(updatedMachine?.gatekeeper == null, 'gatekeeper settings undefined');
  }
});

// -----------------
// WhitelistMint Settings
// -----------------
test('update: candy machine whitelist mint settings', async (t) => {
  // Given I create one candy machine without whitelist mint settings
  const mx = await metaplex();
  const cm = mx.candyMachines();
  const tc = amman.transactionChecker(mx.connection);

  const { candyMachineSigner, payerSigner, walletAddress, candyMachine } =
    await createCandyMachineWithMinimalConfig(mx);

  {
    const [mint] = await amman.genLabeledKeypair('added-mint');

    // When I add whitelist mint settings to that candy machine
    t.comment('adding settings');
    const changes: Partial<CandyMachine> = {
      whitelistMintSettings: {
        mode: WhitelistMintMode.BurnEveryTime,
        discountPrice: 5,
        mint,
        presale: false,
      },
    };

    const { transactionId } = await cm.update({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      walletAddress,
      ...changes,
    });
    await amman.addr.addLabel(
      'tx: add-cm-whitelist-mint-settings',
      transactionId
    );

    // Then the transaction succeeds
    await tc.assertSuccess(t, transactionId);

    // And the candy machine is updated
    const updatedMachine = await mx
      .candyMachines()
      .findByAddress(candyMachineSigner.publicKey);

    // with scalar values unchanged
    assertProperlyUpdatedScalars(t, candyMachine, updatedMachine!, {});

    // and settings configured
    spok(t, updatedMachine?.whitelistMintSettings, {
      mode: changes.whitelistMintSettings?.mode,
      discountPrice: spokSameBignum(
        changes.whitelistMintSettings?.discountPrice
      ),
      mint: changes.whitelistMintSettings?.mint,
      presale: changes.whitelistMintSettings?.presale,
    });
  }

  {
    const [mint] = await amman.genLabeledKeypair('changed-mint');
    // When I then change the settings
    t.comment('changing settings');
    const changes: Partial<CandyMachine> = {
      whitelistMintSettings: {
        mode: WhitelistMintMode.NeverBurn,
        discountPrice: 8,
        mint,
        presale: true,
      },
    };

    const { transactionId } = await cm.update({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      walletAddress,
      ...changes,
    });
    await amman.addr.addLabel(
      'tx: update-cm-whitelist-mint-settings',
      transactionId
    );

    // Then the transaction succeeds
    await tc.assertSuccess(t, transactionId);

    // And the candy machine is updated
    const updatedMachine = await mx
      .candyMachines()
      .findByAddress(candyMachineSigner.publicKey);

    // with scalar values unchanged
    assertProperlyUpdatedScalars(t, candyMachine, updatedMachine!, {});

    // and settings re-configured
    spok(t, updatedMachine?.whitelistMintSettings, {
      mode: changes.whitelistMintSettings?.mode,
      discountPrice: spokSameBignum(
        changes.whitelistMintSettings?.discountPrice
      ),
      mint: changes.whitelistMintSettings?.mint,
      presale: changes.whitelistMintSettings?.presale,
    });
  }

  {
    // When I then remove the settings
    t.comment('removing settings');
    const changes: Partial<CandyMachine> = {
      whitelistMintSettings: undefined,
    };

    const { transactionId } = await cm.update({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      walletAddress,
      ...changes,
    });
    await amman.addr.addLabel(
      'tx: remove-cm-whitelist-mint-settings',
      transactionId
    );

    // Then the transaction succeeds
    await tc.assertSuccess(t, transactionId);

    // And the candy machine is updated
    const updatedMachine = await mx
      .candyMachines()
      .findByAddress(candyMachineSigner.publicKey);

    // with scalar values unchanged
    assertProperlyUpdatedScalars(t, candyMachine, updatedMachine!, {});

    // and settings removed
    t.ok(
      updatedMachine?.whitelistMintSettings == null,
      'whitelist mint settings undefined'
    );
  }
});
