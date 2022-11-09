import { Keypair, PublicKey } from '@solana/web3.js';
import { FreezeEscrow } from '@metaplex-foundation/mpl-candy-guard';
import test from 'tape';
import { AccountState } from '@solana/spl-token';
import spok from 'spok';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
  spokSameBignum,
  spokSamePubkey,
} from '../../../helpers';
import {
  assertMintingWasSuccessful,
  createCandyMachine,
  SEQUENTIAL_ITEM_SETTINGS,
} from '../helpers';
import {
  CandyMachine,
  isEqualToAmount,
  Metaplex,
  sol,
  toBigNumber,
} from '@/index';

killStuckProcess();

test('[candyMachineModule] freezeSolPayment guard: it transfers SOL to an escrow account and freezes the NFT', async (t) => {
  // Given a loaded Candy Machine with a freezeSolPayment guard.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    itemSettings: SEQUENTIAL_ITEM_SETTINGS,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      freezeSolPayment: {
        amount: sol(1),
        destination: treasury.publicKey,
      },
    },
  });

  // And given the freezeSolPayment guard is initialized.
  await mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'freezeSolPayment',
    settings: {
      path: 'initialize',
      period: 15 * 24 * 3600, // 15 days.
      candyGuardAuthority: mx.identity(),
    },
  });

  // When we mint from that candy machine.
  const payer = await createWallet(mx, 10);
  const { nft } = await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
  });

  // And the NFT is frozen.
  t.equal(nft.token.state, AccountState.Frozen, 'NFT is frozen');

  // And cannot be thawed since not all NFTs have been minted.
  const promise = thawNft(mx, candyMachine, nft.address, payer.publicKey);
  await assertThrows(t, promise, /Thaw is not enabled/);

  // And the treasury escrow received SOLs.
  const treasuryEscrow = mx.candyMachines().pdas().freezeEscrow({
    destination: treasury.publicKey,
    candyMachine: candyMachine.address,
    candyGuard: candyMachine.candyGuard!.address,
  });
  const treasuryEscrowBalance = await mx.rpc().getBalance(treasuryEscrow);
  t.true(
    isEqualToAmount(treasuryEscrowBalance, sol(1), sol(0.1)),
    'treasury escrow received SOLs'
  );

  // And was assigned the right data.
  const freezeEscrowAccount = await FreezeEscrow.fromAccountAddress(
    mx.connection,
    treasuryEscrow
  );
  spok(t, freezeEscrowAccount, {
    $topic: 'freeze escrow account',
    candyMachine: spokSamePubkey(candyMachine.address),
    candyGuard: spokSamePubkey(candyMachine.candyGuard!.address),
    frozenCount: spokSameBignum(1),
    firstMintTime: spok.definedObject,
    freezePeriod: spokSameBignum(15 * 24 * 3600),
    destination: spokSamePubkey(treasury.publicKey),
    authority: spokSamePubkey(candyMachine.candyGuard!.authorityAddress),
  });

  // And the payer lost SOLs.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(isEqualToAmount(payerBalance, sol(9), sol(0.1)), 'payer lost SOLs');
});

test('[candyMachineModule] freezeSolPayment guard: it can thaw an NFT once all NFTs are minted', async (t) => {
  // Given a loaded Candy Machine with an initialized
  // freezeSolPayment guard with only one item.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeSolPayment: {
        amount: sol(1),
        destination: treasury.publicKey,
      },
    },
  });
  await initFreezeEscrow(mx, candyMachine);

  // And given we minted the only frozen NFT from that candy machine.
  const payer = await createWallet(mx, 10);
  const { nft } = await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
  });
  t.equal(nft.token.state, AccountState.Frozen, 'NFT is frozen');

  // When we thaw the NFT.
  await thawNft(mx, candyMachine, nft.address, payer.publicKey);

  // Then the NFT is thawed.
  const refreshedNft = await mx.nfts().refresh(nft);
  t.equal(refreshedNft.token.state, AccountState.Initialized, 'NFT is Thawed');
});

test('[candyMachineModule] freezeSolPayment guard: it fails to mint if the freeze escrow was not initialized', async (t) => {
  // Given a loaded Candy Machine with a freezeSolPayment guard.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeSolPayment: {
        amount: sol(1),
        destination: treasury.publicKey,
      },
    },
  });

  // When we try to mint without initializing the freeze escrow.
  const payer = await createWallet(mx, 10);
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /Freeze must be initialized/);

  // And the payer didn't loose any SOL.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(isEqualToAmount(payerBalance, sol(10)), 'payer did not lose SOLs');
});

test('[candyMachineModule] freezeSolPayment guard: it fails if the payer does not have enough funds', async (t) => {
  // Given a loaded Candy Machine with an initialized
  // freezeSolPayment guard costing 5 SOLs.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeSolPayment: {
        amount: sol(5),
        destination: treasury.publicKey,
      },
    },
  });
  await initFreezeEscrow(mx, candyMachine);

  // When we mint from it using a payer that only has 4 SOL.
  const payer = await createWallet(mx, 4);
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /Not enough SOL to pay for the mint/);

  // And the payer didn't loose any SOL.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(isEqualToAmount(payerBalance, sol(4)), 'payer did not lose SOLs');
});

test('[candyMachineModule] freezeSolPayment guard: it fails to mint if the owner is not the payer', async (t) => {
  // Given a loaded Candy Machine with an initialized freezeSolPayment guard.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeSolPayment: {
        amount: sol(1),
        destination: treasury.publicKey,
      },
    },
  });
  await initFreezeEscrow(mx, candyMachine);

  // When we mint using an owner that is not the payer.
  const payer = await createWallet(mx, 10);
  const owner = Keypair.generate().publicKey;
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      owner,
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /The payer must be the owner when using the \[freezeSolPayment\] guard/
  );
});

test('[candyMachineModule] freezeSolPayment guard with bot tax: it charges a bot tax if something goes wrong', async (t) => {
  // Given a loaded Candy Machine with a freezeSolPayment guard and a botTax guard.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      freezeSolPayment: {
        amount: sol(1),
        destination: treasury.publicKey,
      },
    },
  });

  // When we try to mint without initializing the freeze escrow.
  const payer = await createWallet(mx, 10);
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we expect a bot tax error.
  await assertThrows(t, promise, /Candy Machine Bot Tax/);

  // And the payer was charged a bot tax.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(
    isEqualToAmount(payerBalance, sol(9.9), sol(0.01)),
    'payer was charged a bot tax'
  );
});

const initFreezeEscrow = async (mx: Metaplex, candyMachine: CandyMachine) => {
  await mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'freezeSolPayment',
    settings: {
      path: 'initialize',
      period: 15 * 24 * 3600, // 15 days.
      candyGuardAuthority: mx.identity(),
    },
  });
};

const thawNft = async (
  mx: Metaplex,
  candyMachine: CandyMachine,
  nftMint: PublicKey,
  nftOwner: PublicKey
) => {
  await mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'freezeSolPayment',
    settings: {
      path: 'thaw',
      nftMint,
      nftOwner,
    },
  });
};
