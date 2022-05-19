import test from 'tape';
import spok from 'spok';
import {
  amman,
  killStuckProcess,
  metaplex,
  spokSamePubkey,
} from '../../helpers';
import { createCandyMachineWithMinimalConfig } from './helpers';

killStuckProcess();

test('update: candy machine authority to new authority', async (t) => {
  // Given I create one candy machine
  const mx = await metaplex();
  const cm = mx.candyMachines();
  const tc = amman.transactionChecker(mx.connection);

  const { candyMachineSigner, payerSigner, walletAddress } =
    await createCandyMachineWithMinimalConfig(mx);

  const [newAuthorityAddress] = await amman.genLabeledKeypair('newAuthority');

  // When I update that candy machine's authority
  const { transactionId } = await cm.updateAuthority({
    authoritySigner: payerSigner,
    candyMachineAddress: candyMachineSigner.publicKey,
    walletAddress,
    newAuthorityAddress,
  });
  await amman.addr.addLabel(`tx: update-cm-authority`, transactionId);

  // Then the transaction succeeds
  await tc.assertSuccess(t, transactionId);

  // And the candy machine authority is updated
  const updatedMachine = await mx
    .candyMachines()
    .findByAddress(candyMachineSigner.publicKey);

  spok(t, updatedMachine, {
    authorityAddress: spokSamePubkey(newAuthorityAddress),
  });
});

test('update: candy machine authority to same authority', async (t) => {
  // Given I create one candy machine
  const mx = await metaplex();
  const cm = mx.candyMachines();
  const tc = amman.transactionChecker(mx.connection);

  const { candyMachineSigner, payerSigner, walletAddress } =
    await createCandyMachineWithMinimalConfig(mx);

  // When I update that candy machine's authority
  const { transactionId } = await cm.updateAuthority({
    authoritySigner: payerSigner,
    candyMachineAddress: candyMachineSigner.publicKey,
    walletAddress,
    newAuthorityAddress: payerSigner.publicKey,
  });
  await amman.addr.addLabel(`tx: update-cm-authority`, transactionId);

  // Then the transaction succeeds
  await tc.assertSuccess(t, transactionId);

  // And the candy machine authority stayed the same
  const updatedMachine = await mx
    .candyMachines()
    .findByAddress(candyMachineSigner.publicKey);

  spok(t, updatedMachine, {
    authorityAddress: spokSamePubkey(payerSigner.publicKey),
  });
});
