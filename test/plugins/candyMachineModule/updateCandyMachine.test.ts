import test from 'tape';
import spok from 'spok';
import {
  amman,
  assertConfirmedWithoutError,
  killStuckProcess,
  metaplex,
  spokSameBignum,
} from '../../helpers';
import { createCandyMachineWithMinimalConfig } from './helpers';
import { CandyMachineData, cusper } from '@metaplex-foundation/mpl-candy-machine';
import { CandyMachine } from '@/plugins';

killStuckProcess();

function assertProperlyUpdated(
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

type ValueOf<T> = T[keyof T];
test('update: candy machine single property', async (t) => {
  // Given I create one candy machine
  const mx = await metaplex();
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
    t.comment(`+++ Updating ${key}`);

    // When I update that candy machine's property
    const candyMachineData = currentCandyMachine.candyMachineData;
    (candyMachineData as Record<keyof CandyMachineData, ValueOf<CandyMachineData>>)[key] = value;

    const cm = mx.candyMachines();
    const { transactionId, confirmResponse } = await cm.updateCandyMachine({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      walletAddress,
      ...candyMachineData,
    });
    await amman.addr.addLabel(`tx: update-cm-${key}`, transactionId);

    // Then the transaction succeeds
    assertConfirmedWithoutError(t, cusper, confirmResponse);

    // And the candy machine is updated
    const updatedMachine = await mx
      .candyMachines()
      .findCandyMachineByAddress(candyMachineSigner.publicKey);
    t.ok(updatedMachine != null, 'finds updated machine');
    assertProperlyUpdated(t, currentCandyMachine, updatedMachine!, { [key]: value });
    currentCandyMachine = updatedMachine!;
  }
});

test.only('update: candy machine multiple properties', async (t) => {
  // Given I create one candy machine
  const mx = await metaplex();
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

    t.comment(`+++ Updating ${keys.join(', ')}`);

    // When I update that candy machine's property
    const candyMachineData = currentCandyMachine.candyMachineData;
    for (const [key, value] of changeSet) {
      (candyMachineData as Record<keyof CandyMachineData, ValueOf<CandyMachineData>>)[key] = value;
    }

    const cm = mx.candyMachines();
    const { transactionId, confirmResponse } = await cm.updateCandyMachine({
      authoritySigner: payerSigner,
      candyMachineAddress: candyMachineSigner.publicKey,
      walletAddress,
      ...candyMachineData,
    });
    await amman.addr.addLabel(`tx: update-cm-${keys.join(', ')}`, transactionId);

    // Then the transaction succeeds
    assertConfirmedWithoutError(t, cusper, confirmResponse);

    // And the candy machine is updated
    const updatedMachine = await mx
      .candyMachines()
      .findCandyMachineByAddress(candyMachineSigner.publicKey);
    t.ok(updatedMachine != null, 'finds updated machine');

    const expectedChanges = changeSet.reduce((acc, [key, val]) => {
      (acc as Record<keyof CandyMachineData, ValueOf<CandyMachineData>>)[key] = val;
      return acc;
    }, {});
    assertProperlyUpdated(t, currentCandyMachine, updatedMachine!, expectedChanges);
    currentCandyMachine = updatedMachine!;
  }
});
