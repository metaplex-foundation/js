import test from 'tape';
import spok from 'spok';
import { killStuckProcess, metaplex, spokSamePubkey } from '../../helpers';
import { createCandyMachineWithMinimalConfig } from './helpers';

killStuckProcess();

// -----------------
// Wallet
// -----------------
test('candyMachineGPA: candyMachineAccountsForWallet for wallet with one candy machine created', async (t) => {
  // Given I create one candy machine with a wallet
  const mx = await metaplex();
  const { candyMachineSigner, authorityAddress, walletAddress } =
    await createCandyMachineWithMinimalConfig(mx);

  // When I get the candy machines for the wallet
  const candyMachines = await mx.candyMachines().findAllByWallet(walletAddress);

  // It returns that candy machine
  t.equal(candyMachines.length, 1, 'returns one account');
  const cm = candyMachines[0];
  spok(t, cm, {
    $topic: 'candyMachine',
    authorityAddress: spokSamePubkey(authorityAddress),
    walletAddress: spokSamePubkey(walletAddress),
  });
  t.ok(
    candyMachineSigner.publicKey.toBase58().startsWith(cm.uuid),
    'candy machine uuid matches candyMachineSigner'
  );
});

test('candyMachineGPA: candyMachineAccountsForWallet for wallet with two candy machines created for that wallet and one for another', async (t) => {
  // Given I create one candy machine with wallet1 and two with wallet2

  // Other wallet
  {
    const mx = await metaplex();
    await createCandyMachineWithMinimalConfig(mx);
  }

  const mx = await metaplex();
  // This wallet
  {
    await createCandyMachineWithMinimalConfig(mx);
    await createCandyMachineWithMinimalConfig(mx);
  }

  // When I get the candy machines for the wallet
  const candyMachines = await mx
    .candyMachines()
    .findAllByWallet(mx.identity().publicKey);

  // It returns the two candy machine of wallet2
  t.equal(candyMachines.length, 2, 'returns two machines');

  for (const cm of candyMachines) {
    t.ok(cm.walletAddress.equals(mx.identity().publicKey), 'wallet matches');
  }
});

// -----------------
// Authority
// -----------------
test('candyMachineGPA: candyMachineAccountsForAuthority for authority with one candy machine created', async (t) => {
  // Given I create a candy machine with a specific auhority
  const mx = await metaplex();
  const { candyMachineSigner, authorityAddress, walletAddress } =
    await createCandyMachineWithMinimalConfig(mx);

  // When I get the candy machines for that authority
  const candyMachines = await mx
    .candyMachines()
    .findAllByAuthority(authorityAddress);

  // It returns that one candy machine for that authority
  t.equal(candyMachines.length, 1, 'returns one account');
  const cm = candyMachines[0];
  spok(t, cm, {
    $topic: 'candyMachine',
    authorityAddress: spokSamePubkey(authorityAddress),
    walletAddress: spokSamePubkey(walletAddress),
  });
  t.ok(
    candyMachineSigner.publicKey.toBase58().startsWith(cm.uuid),
    'candy machine uuid matches candyMachineSigner'
  );
});
