import test from 'tape';
import {
  amman,
  assertConfirmedWithoutError,
  killStuckProcess,
  metaplex,
  SKIP_PREFLIGHT,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import { CandyMachine, cusper } from '@metaplex-foundation/mpl-candy-machine';
import { Keypair, PublicKey } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import { Signer } from '../../../src/shared';
import { Creator } from '@metaplex-foundation/mpl-token-metadata';

killStuckProcess();

function assertProperlyInitialized(
  t: test.Test,
  {
    candyMachineSigner,
    payer,
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
  spok(t, candyMachine.data.creators, <Specifications<Creator[]>>[
    {
      $topic: 'creators',
      address: spokSamePubkey(payer.publicKey),
      verified: false,
      share: 100,
    },
  ]);
}

test('candyMachine: init with minimal config', async (t) => {
  const mx = await metaplex();
  const payer = mx.identity();

  // TODO(thlorenz): prod code could default to this creator setting
  const creators = [{ address: payer.publicKey.toBase58(), verified: false, share: 100 }];
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

  const { transactionId, confirmResponse, ...rest } = await cm.initCandyMachineFromConfig(
    config,
    opts
  );
  await amman.addr.addLabel('initCandyMachine', transactionId);

  assertConfirmedWithoutError(t, cusper, confirmResponse);
  assertProperlyInitialized(t, { ...rest, ...config, tokenMint: null });
});
