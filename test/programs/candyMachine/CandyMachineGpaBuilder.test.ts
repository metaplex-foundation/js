import test from 'tape';
import spok from 'spok';
import { Keypair } from '@solana/web3.js';
import { amman, killStuckProcess, metaplex, SKIP_PREFLIGHT, spokSamePubkey } from '../../helpers';
import { CandyMachineConfigWithoutStorage } from '@/plugins/candyMachineModule/config';
import { CandyMachineAccount, CandyMachineProgram } from '../../../src/programs';
import { Metaplex } from '../../../src/Metaplex';

killStuckProcess();
async function createCandyMachine(mx: Metaplex) {
  const payer = mx.identity();

  const solTreasurySigner = payer;
  await amman.airdrop(mx.connection, solTreasurySigner.publicKey, 100);

  const config: CandyMachineConfigWithoutStorage = {
    price: 1.0,
    number: 10,
    sellerFeeBasisPoints: 0,
    solTreasuryAccount: solTreasurySigner.publicKey.toBase58(),
    goLiveDate: '25 Dec 2021 00:00:00 GMT',
    retainAuthority: true,
    isMutable: false,
  };

  const opts = {
    candyMachine: Keypair.generate(),
    confirmOptions: SKIP_PREFLIGHT,
  };
  await amman.addr.addLabels({ ...config, ...opts, payer });

  const cm = mx.candyMachine();
  const {
    transactionId,
    confirmResponse,
    candyMachine,
    payerSigner,
    candyMachineSigner,
    authorityAddress,
    walletAddress,
  } = await cm.createCandyMachineFromConfig(config, opts);

  await amman.addr.addLabel('create: candy-machine', transactionId);

  return {
    cm,

    transactionId,
    confirmResponse,
    candyMachine,
    config,

    solTreasurySigner,
    payerSigner,
    candyMachineSigner,
    authorityAddress,
    walletAddress,
  };
}

// -----------------
// Wallet
// -----------------
test('candyMachineGPA: candyMachineAccountsForWallet for wallet with one candy machine created', async (t) => {
  const mx = await metaplex();
  const { candyMachineSigner, authorityAddress, walletAddress } = await createCandyMachine(mx);

  const gpa = CandyMachineProgram.accounts(mx);
  const accounts = await gpa.candyMachineAccountsForWallet(walletAddress).get();

  t.equal(accounts.length, 1, 'returns one account');
  const cm = CandyMachineAccount.from(accounts[0]);
  spok(t, cm, {
    $topic: 'candyMachineAccount',
    data: {
      authority: spokSamePubkey(authorityAddress),
      wallet: spokSamePubkey(walletAddress),
    },
  });
  t.ok(
    candyMachineSigner.publicKey.toBase58().startsWith(cm.data.data.uuid),
    'candy machine uuid matches candyMachineSigner'
  );
});

test('candyMachineGPA: candyMachineAccountsForWallet for wallet with two candy machines created for that wallet and one for another', async (t) => {
  // Other wallet
  {
    const mx = await metaplex();
    await createCandyMachine(mx);
  }

  const mx = await metaplex();
  // This wallet
  {
    await createCandyMachine(mx);
    await createCandyMachine(mx);
  }

  const gpa = CandyMachineProgram.accounts(mx);
  const accounts = await gpa.candyMachineAccountsForWallet(mx.identity().publicKey).get();

  t.equal(accounts.length, 2, 'returns two accounts');

  for (const cm of accounts.map(CandyMachineAccount.from)) {
    t.ok(cm.data.wallet.equals(mx.identity().publicKey), 'wallet matches');
  }
});

// -----------------
// Authority
// -----------------
test('candyMachineGPA: candyMachineAccountsForAuthority for authority with one candy machine created', async (t) => {
  const mx = await metaplex();
  const { candyMachineSigner, authorityAddress, walletAddress } = await createCandyMachine(mx);

  const gpa = CandyMachineProgram.accounts(mx);
  const accounts = await gpa.candyMachineAccountsForAuthority(authorityAddress).get();

  t.equal(accounts.length, 1, 'returns one account');
  const cm = CandyMachineAccount.from(accounts[0]);
  spok(t, cm, {
    $topic: 'candyMachineAccount',
    data: {
      authority: spokSamePubkey(authorityAddress),
      wallet: spokSamePubkey(walletAddress),
    },
  });
  t.ok(
    candyMachineSigner.publicKey.toBase58().startsWith(cm.data.data.uuid),
    'candy machine uuid matches candyMachineSigner'
  );
});
