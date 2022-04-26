import test from 'tape';
import {
  amman,
  assertConfirmedWithoutError,
  killStuckProcess,
  metaplex,
  SKIP_PREFLIGHT,
  spokSameBignum,
} from '../../helpers';
import { CandyMachine, cusper, EndSettingType } from '@metaplex-foundation/mpl-candy-machine';
import { Keypair, PublicKey } from '@solana/web3.js';
import spok from 'spok';
import { Signer } from '../../../src/shared';
import {
  CandyMachineConfigWithoutStorage,
  creatorsConfigDefault,
} from '../../../src/modules/candy-machine/models/config';
import { assertCreators } from '../../helpers/candy-machine';
import BN from 'bn.js';

killStuckProcess();

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

test('candyMachine: init with minimal config', async (t) => {
  const mx = await metaplex();
  const payer = mx.identity();

  const solTreasuryAccount = Keypair.generate();
  await amman.airdrop(mx.connection, solTreasuryAccount.publicKey, 100);

  const config = {
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
  await amman.addr.addLabels({ ...config, ...opts, payer });

  const cm = mx.candyMachine();

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
  const mx = await metaplex();
  const payer = mx.identity();

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
  const solTreasuryAccount = Keypair.generate();
  await amman.airdrop(mx.connection, solTreasuryAccount.publicKey, 100);

  const config = {
    price: 1.0,
    number: 10,
    sellerFeeBasisPoints: 0,
    solTreasuryAccount: solTreasuryAccount.publicKey.toBase58(),
    goLiveDate: '25 Dec 2021 00:00:00 GMT',
    retainAuthority: true,
    isMutable: false,
    creators,
  };

  const opts = {
    candyMachine: Keypair.generate(),
    confirmOptions: SKIP_PREFLIGHT,
  };
  await amman.addr.addLabels({ ...config, ...opts, payer });

  const cm = mx.candyMachine();

  const { transactionId, confirmResponse, candyMachine, ...rest } =
    await cm.initCandyMachineFromConfig(config, opts);
  await amman.addr.addLabel('initCandyMachine', transactionId);

  assertConfirmedWithoutError(t, cusper, confirmResponse);
  assertProperlyInitialized(t, { ...rest, ...config, candyMachine, tokenMint: null });
  assertCreators(t, candyMachine.data.creators, config.creators);
});

test('candyMachine: init with end settings - amount', async (t) => {
  const mx = await metaplex();
  const payer = mx.identity();

  const solTreasuryAccount = Keypair.generate();
  await amman.airdrop(mx.connection, solTreasuryAccount.publicKey, 100);

  const config: CandyMachineConfigWithoutStorage = {
    price: 1.0,
    number: 10,
    sellerFeeBasisPoints: 0,
    solTreasuryAccount: solTreasuryAccount.publicKey.toBase58(),
    goLiveDate: '25 Dec 2021 00:00:00 GMT',
    retainAuthority: true,
    isMutable: false,
    endSettings: { endSettingType: 'amount', value: 100 },
  };

  const opts = {
    candyMachine: Keypair.generate(),
    confirmOptions: SKIP_PREFLIGHT,
  };
  await amman.addr.addLabels({ ...config, ...opts, payer });

  const cm = mx.candyMachine();

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
  const mx = await metaplex();
  const payer = mx.identity();

  const solTreasuryAccount = Keypair.generate();
  await amman.airdrop(mx.connection, solTreasuryAccount.publicKey, 100);

  const config: CandyMachineConfigWithoutStorage = {
    price: 1.0,
    number: 10,
    sellerFeeBasisPoints: 0,
    solTreasuryAccount: solTreasuryAccount.publicKey.toBase58(),
    goLiveDate: '25 Dec 2021 00:00:00 GMT',
    retainAuthority: true,
    isMutable: false,
    endSettings: { endSettingType: 'date', value: '25 Jan 2022 00:00:00 GMT' },
  };

  const opts = {
    candyMachine: Keypair.generate(),
    confirmOptions: SKIP_PREFLIGHT,
  };
  await amman.addr.addLabels({ ...config, ...opts, payer });

  const cm = mx.candyMachine();

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
