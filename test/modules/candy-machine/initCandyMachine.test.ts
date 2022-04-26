import test from 'tape';
import {
  amman,
  assertConfirmedWithoutError,
  assertThrows,
  hash32Bit,
  killStuckProcess,
  metaplex,
  SKIP_PREFLIGHT,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import {
  CandyMachine,
  cusper,
  EndSettingType,
  GatekeeperConfig,
} from '@metaplex-foundation/mpl-candy-machine';
import { Keypair, PublicKey } from '@solana/web3.js';
import spok from 'spok';
import { Signer } from '../../../src/shared';
import {
  CandyMachineConfigWithoutStorage,
  creatorsConfigDefault,
} from '../../../src/modules/candy-machine/models/config';
import { assertCreators } from '../../helpers/candy-machine';

killStuckProcess();

async function init() {
  const mx = await metaplex();
  const payer = mx.identity();

  const solTreasuryAccount = Keypair.generate();
  await amman.airdrop(mx.connection, solTreasuryAccount.publicKey, 100);

  const minimalConfig: CandyMachineConfigWithoutStorage = {
    price: 1.0,
    number: 10,
    sellerFeeBasisPoints: 0,
    solTreasuryAccount: solTreasuryAccount.publicKey.toBase58(),
    goLiveDate: '25 Dec 2021 00:00:00 GMT',
    retainAuthority: true,
    isMutable: false,
  };

  const opts = {
    candyMachine: Keypair.generate(),
    confirmOptions: SKIP_PREFLIGHT,
  };
  await amman.addr.addLabels({ ...minimalConfig, ...opts, payer });

  const cm = mx.candyMachine();
  return { cm, payer, solTreasuryAccount, minimalConfig, opts };
}

function assertProperlyInitialized(
  t: test.Test,
  {
    candyMachineSigner,
    payer: _,
    wallet,
    authority,
    candyMachine,
    price,
    sellerFeeBasisPoints,
    number,
    isMutable,
    retainAuthority,
    goLiveDate,
    tokenMint,
  }: {
    // Accounts
    candyMachineSigner: Signer;
    payer: Signer;
    wallet: PublicKey;
    authority: PublicKey;
    // Data
    candyMachine: CandyMachine;
    // Config
    price: number;
    sellerFeeBasisPoints: number;
    number: number;
    isMutable: boolean;
    retainAuthority: boolean;
    goLiveDate: string;
    // Extra
    tokenMint: PublicKey | null;
  }
) {
  spok(t, candyMachine.pretty(), {
    $topic: 'candy machine',
    authority: authority.toBase58(),
    wallet: wallet.toBase58(),
    tokenMint,
    itemsRedeemed: spokSameBignum(0),
    data: {
      uuid: candyMachineSigner.publicKey.toBase58().slice(0, 6),
      price: spokSameBignum(price),
      sellerFeeBasisPoints: spokSameBignum(sellerFeeBasisPoints),
      maxSupply: spokSameBignum(number),
      itemsAvailable: spokSameBignum(number),
      isMutable,
      retainAuthority,
      goLiveDate: spokSameBignum(new Date(goLiveDate).valueOf()),
    },
  });
}

// -----------------
// Minimal Config
// -----------------
test('candyMachine: init with minimal config', async (t) => {
  const { cm, solTreasuryAccount, minimalConfig, opts } = await init();
  const config = minimalConfig;

  const { transactionId, confirmResponse, candyMachine, ...rest } =
    await cm.initCandyMachineFromConfig(config, opts);
  await amman.addr.addLabel('initCandyMachine', transactionId);

  assertConfirmedWithoutError(t, cusper, confirmResponse);
  assertProperlyInitialized(t, {
    ...rest,
    ...config,
    candyMachine,
    tokenMint: null,
  });
  assertCreators(
    t,
    candyMachine.data.creators,
    creatorsConfigDefault(solTreasuryAccount.publicKey.toBase58())
  );
});

test('candyMachine: init with config specifying creators', async (t) => {
  const { cm, payer, minimalConfig, opts } = await init();

  const [coCreator] = await amman.genLabeledKeypair('coCreator');
  const creators = [
    {
      address: payer.publicKey.toBase58(),
      verified: false,
      share: 50,
    },
    {
      address: coCreator.toBase58(),
      verified: false,
      share: 50,
    },
  ];
  const config = { ...minimalConfig, creators };

  const { transactionId, confirmResponse, candyMachine, ...rest } =
    await cm.initCandyMachineFromConfig(config, opts);
  await amman.addr.addLabel('initCandyMachine', transactionId);

  assertConfirmedWithoutError(t, cusper, confirmResponse);
  assertProperlyInitialized(t, { ...rest, ...config, candyMachine, tokenMint: null });
  assertCreators(t, candyMachine.data.creators, config.creators);
});

// -----------------
// End Settings
// -----------------
test('candyMachine: init with end settings - amount', async (t) => {
  const { cm, minimalConfig, opts } = await init();

  const config: CandyMachineConfigWithoutStorage = {
    ...minimalConfig,
    endSettings: { endSettingType: 'amount', value: 100 },
  };

  const { transactionId, confirmResponse, candyMachine, ...rest } =
    await cm.initCandyMachineFromConfig(config, opts);
  await amman.addr.addLabel('initCandyMachine', transactionId);

  assertConfirmedWithoutError(t, cusper, confirmResponse);
  assertProperlyInitialized(t, {
    ...rest,
    ...config,
    candyMachine,
    tokenMint: null,
  });
  spok(t, candyMachine.data.endSettings, {
    $topic: 'end settings',
    endSettingType: EndSettingType.Amount,
    number: spokSameBignum(new Date(config.endSettings?.value! as number).valueOf()),
  });
});

test('candyMachine: init with end settings - date', async (t) => {
  const { cm, minimalConfig, opts } = await init();

  const config: CandyMachineConfigWithoutStorage = {
    ...minimalConfig,
    endSettings: { endSettingType: 'date', value: '25 Jan 2022 00:00:00 GMT' },
  };

  const { transactionId, confirmResponse, candyMachine, ...rest } =
    await cm.initCandyMachineFromConfig(config, opts);
  await amman.addr.addLabel('initCandyMachine', transactionId);

  assertConfirmedWithoutError(t, cusper, confirmResponse);
  assertProperlyInitialized(t, {
    ...rest,
    ...config,
    candyMachine,
    tokenMint: null,
  });
  spok(t, candyMachine.data.endSettings, {
    $topic: 'end settings',
    endSettingType: EndSettingType.Date,
    number: spokSameBignum(new Date(config.endSettings?.value! as string).valueOf()),
  });
});

// -----------------
// Hidden Settings
// -----------------
test('candyMachine: init with invalid hidden settings (hash too short)', async (t) => {
  const { cm, minimalConfig, opts } = await init();

  const config: CandyMachineConfigWithoutStorage = {
    ...minimalConfig,
    hiddenSettings: {
      hash: 'not 32-bit',
      uri: 'https://example.com',
      name: 'mint-name',
    },
  };

  await assertThrows(
    t,
    () => cm.initCandyMachineFromConfig(config, opts),
    /len.+10.+should match len.+32/i
  );
});

test.skip('candyMachine: init with invalid hidden settings program error', async (t) => {
  // TODO(thlorenz): most likely due to incorrect account sizing when allocating candy machine
  // Program log: panicked at 'index out of bounds: the len is 713 but the index is 3117', src/lib.rs:697:13
  const { cm, minimalConfig, opts } = await init();

  const config: CandyMachineConfigWithoutStorage = {
    ...minimalConfig,
    hiddenSettings: {
      hash: hash32Bit('cache-file..'),
      uri: 'https://example.com',
      name: 'mint-name',
    },
  };

  const { transactionId, confirmResponse, candyMachine, ...rest } =
    await cm.initCandyMachineFromConfig(config, opts);
  await amman.addr.addLabel('initCandyMachine', transactionId);

  assertConfirmedWithoutError(t, cusper, confirmResponse);
  assertProperlyInitialized(t, {
    ...rest,
    ...config,
    candyMachine,
    tokenMint: null,
  });
});

// -----------------
// Gatekeeper Settings
// -----------------
test('candyMachine: with gatekeeper settings', async (t) => {
  const [gateKeeper] = amman.genKeypair();

  const { cm, minimalConfig, opts } = await init();

  const config: CandyMachineConfigWithoutStorage = {
    ...minimalConfig,
    gatekeeper: { expireOnUse: true, gatekeeperNetwork: gateKeeper.toBase58() },
  };

  const { transactionId, confirmResponse, candyMachine, ...rest } =
    await cm.initCandyMachineFromConfig(config, opts);
  await amman.addr.addLabel('initCandyMachine', transactionId);

  assertConfirmedWithoutError(t, cusper, confirmResponse);
  assertProperlyInitialized(t, {
    ...rest,
    ...config,
    candyMachine,
    tokenMint: null,
  });
  spok(t, candyMachine.data.gatekeeper as GatekeeperConfig, {
    $topic: 'gatekeeper',
    expireOnUse: config.gatekeeper?.expireOnUse,
    gatekeeperNetwork: spokSamePubkey(config.gatekeeper?.gatekeeperNetwork),
  });
});

test('candyMachine: with invalid gatekeeper settings (network not a public key)', async (t) => {
  const { cm, minimalConfig, opts } = await init();

  const config: CandyMachineConfigWithoutStorage = {
    ...minimalConfig,
    gatekeeper: { expireOnUse: true, gatekeeperNetwork: '<invalid>' },
  };

  await assertThrows(
    t,
    () => cm.initCandyMachineFromConfig(config, opts),
    /not a valid PublicKey/i
  );
});
