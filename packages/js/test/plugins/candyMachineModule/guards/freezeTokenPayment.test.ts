import { FreezeEscrow } from '@metaplex-foundation/mpl-candy-guard';
import { AccountState } from '@solana/spl-token';
import { Keypair, PublicKey } from '@solana/web3.js';
import spok from 'spok';
import test, { Test } from 'tape';
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
  Mint,
  Signer,
  sol,
  toBigNumber,
  token,
  TokenWithMint,
} from '@/index';

killStuckProcess();

test.only('[candyMachineModule] freezeTokenPayment guard: it transfers tokens to an escrow account and freezes the NFT', async (t) => {
  // Given a loaded Candy Machine with a freezeTokenPayment guard.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const [mint, treasuryAta] = await createMint(mx, treasury);
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    itemSettings: SEQUENTIAL_ITEM_SETTINGS,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      freezeTokenPayment: {
        amount: token(1),
        destinationAta: treasury.publicKey,
        mint: mint.address,
      },
    },
  });

  // And given the freezeTokenPayment guard is initialized.
  await mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'freezeTokenPayment',
    settings: {
      path: 'initialize',
      period: 15 * 24 * 3600, // 15 days.
      candyGuardAuthority: mx.identity(),
    },
  });

  // When we mint from that candy machine.
  const payer = await createTokenPayer(mx, mint, treasury, 10);
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
  const freezeEscrow = getFreezeEscrow(mx, candyMachine, treasuryAta);
  const escrowTokens = await getTokenBalance(mx, mint, freezeEscrow);
  t.true(
    isEqualToAmount(escrowTokens, token(1)),
    'treasury escrow received tokens'
  );

  // And was assigned the right data.
  const freezeEscrowAccount = await FreezeEscrow.fromAccountAddress(
    mx.connection,
    freezeEscrow
  );
  spok(t, freezeEscrowAccount, {
    $topic: 'freeze escrow account',
    candyMachine: spokSamePubkey(candyMachine.address),
    candyGuard: spokSamePubkey(candyMachine.candyGuard!.address),
    frozenCount: spokSameBignum(1),
    firstMintTime: spok.definedObject,
    freezePeriod: spokSameBignum(15 * 24 * 3600),
    destination: spokSamePubkey(treasuryAta.address),
    authority: spokSamePubkey(candyMachine.candyGuard!.authorityAddress),
  });

  // And the payer lost tokens.
  const payerBalance = await getTokenBalance(mx, mint, payer.publicKey);
  t.true(isEqualToAmount(payerBalance, token(9)), 'payer lost tokens');
});

test.skip('[candyMachineModule] freezeTokenPayment guard: it can thaw an NFT once all NFTs are minted', async (t) => {
  // Given a loaded Candy Machine with an initialized
  // freezeTokenPayment guard with only one item.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeTokenPayment: {
        amount: token(1),
        destinationAta: treasury.publicKey,
        mint: Keypair.generate().publicKey, // TODO
      },
    },
  });
  await initFreezeEscrow(mx, candyMachine);

  // And given we minted the only frozen NFT from that candy machine.
  const payer = await createWallet(mx, 10);
  const nft = await mintNft(mx, candyMachine, collection, payer);
  t.equal(nft.token.state, AccountState.Frozen, 'NFT is frozen');

  // When we thaw the NFT.
  await thawNft(mx, candyMachine, nft.address, payer.publicKey);

  // Then the NFT is thawed.
  const refreshedNft = await mx.nfts().refresh(nft);
  t.equal(refreshedNft.token.state, AccountState.Initialized, 'NFT is Thawed');
});

test.skip('[candyMachineModule] freezeTokenPayment guard: it can unlock funds once all NFTs have been thawed', async (t) => {
  // Given a loaded Candy Machine with an initialized freezeTokenPayment guard.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeTokenPayment: {
        amount: token(1),
        destinationAta: treasury.publicKey,
        mint: Keypair.generate().publicKey, // TODO
      },
    },
  });
  await initFreezeEscrow(mx, candyMachine);

  // And given all NFTs have been minted and thawed.
  const payer = await createWallet(mx, 10);
  const nft = await mintNft(mx, candyMachine, collection, payer);
  await thawNft(mx, candyMachine, nft.address, payer.publicKey);

  // When the authority unlocks the funds.
  await mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'freezeTokenPayment',
    settings: {
      path: 'unlockFunds',
      candyGuardAuthority: mx.identity(),
    },
  });

  // Then the destination wallet received the funds.
  const treasuryBalance = await mx.rpc().getBalance(treasury.publicKey);
  t.true(
    isEqualToAmount(treasuryBalance, sol(1), sol(0.1)),
    'treasury received SOLs'
  );

  // And the treasury escrow has been emptied.
  const treasuryEscrow = getFreezeEscrow(mx, candyMachine, treasury);
  const treasuryEscrowBalance = await mx.rpc().getBalance(treasuryEscrow);
  t.true(
    isEqualToAmount(treasuryEscrowBalance, sol(0)),
    'treasury escrow received SOLs'
  );
});

test.skip('[candyMachineModule] freezeTokenPayment guard: it cannot unlock funds if not all NFTs have been thawed', async (t) => {
  // Given a loaded Candy Machine with an initialized freezeTokenPayment guard.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeTokenPayment: {
        amount: token(1),
        destinationAta: treasury.publicKey,
        mint: Keypair.generate().publicKey, // TODO
      },
    },
  });
  await initFreezeEscrow(mx, candyMachine);

  // And given all NFTs have been minted but not thawed.
  const payer = await createWallet(mx, 10);
  await mintNft(mx, candyMachine, collection, payer);

  // When the authority tries to unlock the funds.
  const promise = mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'freezeTokenPayment',
    settings: {
      path: 'unlockFunds',
      candyGuardAuthority: mx.identity(),
    },
  });

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /Unlock is not enabled \(not all NFTs are thawed\)/
  );

  // And the destination wallet did not receive any funds.
  const treasuryBalance = await mx.rpc().getBalance(treasury.publicKey);
  t.true(isEqualToAmount(treasuryBalance, sol(0)), 'treasury received no SOLs');
});

test.skip('[candyMachineModule] freezeTokenPayment guard: it can have multiple freeze escrow and reuse the same ones', async (t) => {
  // Given a loaded Candy Machine with 4 groups
  // containing freezeTokenPayment guards such that:
  // - Group A and Group B use the same destination (and thus freeze escrow).
  // - Group C uses a different destination than group A and B.
  // - Group D does not use a freezeTokenPayment guard at all.
  const mx = await metaplex();
  const treasuryAB = Keypair.generate();
  const treasuryC = Keypair.generate();
  const treasuryD = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(4),
    itemSettings: SEQUENTIAL_ITEM_SETTINGS,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
      { name: 'Degen #3', uri: 'https://example.com/degen/3' },
      { name: 'Degen #4', uri: 'https://example.com/degen/4' },
    ],
    guards: {},
    groups: [
      {
        label: 'GROUPA',
        guards: {
          freezeTokenPayment: {
            amount: token(0.5),
            destinationAta: treasuryAB.publicKey,
            mint: Keypair.generate().publicKey, // TODO
          },
        },
      },
      {
        label: 'GROUPB',
        guards: {
          freezeTokenPayment: {
            amount: token(1),
            destinationAta: treasuryAB.publicKey,
            mint: Keypair.generate().publicKey, // TODO
          },
        },
      },
      {
        label: 'GROUPC',
        guards: {
          freezeTokenPayment: {
            amount: token(2),
            destinationAta: treasuryC.publicKey,
            mint: Keypair.generate().publicKey, // TODO
          },
        },
      },
      {
        label: 'GROUPD',
        guards: {
          tokenPayment: {
            amount: token(3),
            destinationAta: treasuryD.publicKey,
            mint: Keypair.generate().publicKey, // TODO
          },
        },
      },
    ],
  });

  // And given all freeze escrows have been initialized.
  await initFreezeEscrow(mx, candyMachine, 'GROUPA');
  await initFreezeEscrow(mx, candyMachine, 'GROUPC');

  // Note that trying to initialize the escrow for group B will fail
  // because it has already been initialized via group A.
  await assertThrows(
    t,
    initFreezeEscrow(mx, candyMachine, 'GROUPB'),
    /The freeze escrow account already exists/
  );

  // When we mint all 4 NFTs via each group.
  const payer = await createWallet(mx, 10);
  const nftA = await mintNft(mx, candyMachine, collection, payer, 'GROUPA'); // 0.5 SOL
  const nftB = await mintNft(mx, candyMachine, collection, payer, 'GROUPB'); // 1 SOL
  const nftC = await mintNft(mx, candyMachine, collection, payer, 'GROUPC'); // 2 SOL
  const nftD = await mintNft(mx, candyMachine, collection, payer, 'GROUPD'); // 3 SOL

  // Then all NFTs except for group D have been frozen.
  t.equal(nftA.token.state, AccountState.Frozen, 'NFT A is frozen');
  t.equal(nftB.token.state, AccountState.Frozen, 'NFT B is frozen');
  t.equal(nftC.token.state, AccountState.Frozen, 'NFT C is frozen');
  t.equal(nftD.token.state, AccountState.Initialized, 'NFT D is not frozen');

  // And the treasury escrow received SOLs.
  const treasuryEscrowAB = getFreezeEscrow(mx, candyMachine, treasuryAB);
  const treasuryEscrowC = getFreezeEscrow(mx, candyMachine, treasuryC);
  const treasuryEscrowBalanceAB = await mx.rpc().getBalance(treasuryEscrowAB);
  const treasuryEscrowBalanceC = await mx.rpc().getBalance(treasuryEscrowC);
  t.true(
    isEqualToAmount(treasuryEscrowBalanceAB, sol(1.5), sol(0.1)),
    'treasury AB escrow received SOLs'
  );
  t.true(
    isEqualToAmount(treasuryEscrowBalanceC, sol(2), sol(0.1)),
    'treasury C escrow received SOLs'
  );

  // And the payer lost SOLs.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(
    isEqualToAmount(payerBalance, sol(10 - 6.5), sol(0.1)),
    'payer lost SOLs'
  );

  // And the frozen counters securely decrease as we thaw all frozen NFTs.
  const assertFrozenCounts = async (ab: number, c: number) => {
    await Promise.all([
      assertFrozenCount(t, mx, candyMachine, treasuryAB, ab),
      assertFrozenCount(t, mx, candyMachine, treasuryC, c),
    ]);
  };
  await assertFrozenCounts(2, 1);
  await thawNft(mx, candyMachine, nftD.address, payer.publicKey, 'GROUPA'); // Not frozen.
  await assertFrozenCounts(2, 1); // No change.
  await thawNft(mx, candyMachine, nftA.address, payer.publicKey, 'GROUPA');
  await assertFrozenCounts(1, 1); // AB decreased.
  await thawNft(mx, candyMachine, nftA.address, payer.publicKey, 'GROUPA'); // Already thawed.
  await assertFrozenCounts(1, 1); // No change.
  await thawNft(mx, candyMachine, nftB.address, payer.publicKey, 'GROUPB');
  await assertFrozenCounts(0, 1); // AB decreased.
  await thawNft(mx, candyMachine, nftC.address, payer.publicKey, 'GROUPC');
  await assertFrozenCounts(0, 0); // C decreased.

  // And when the authority unlocks the funds of both freeze escrows.
  await unlockFunds(mx, candyMachine, 'GROUPA');
  await unlockFunds(mx, candyMachine, 'GROUPC');

  // Note that trying to unlock the funds of group B will fail
  // because it has already been unlocked via group A.
  await assertThrows(
    t,
    unlockFunds(mx, candyMachine, 'GROUPB'),
    /The program expected this account to be already initialized/
  );

  // Then the treasuries received the funds.
  const treasuryBalanceAB = await mx.rpc().getBalance(treasuryAB.publicKey);
  const treasuryBalanceC = await mx.rpc().getBalance(treasuryC.publicKey);
  const treasuryBalanceD = await mx.rpc().getBalance(treasuryD.publicKey);
  t.true(
    isEqualToAmount(treasuryBalanceAB, sol(1.5), sol(0.1)),
    'treasury AB received the funds'
  );
  t.true(
    isEqualToAmount(treasuryBalanceC, sol(2), sol(0.1)),
    'treasury C  received the funds'
  );
  t.true(
    isEqualToAmount(treasuryBalanceD, sol(3), sol(0.1)),
    'treasury D  received the funds'
  );

  // And the treasury escrows are empty.
  const newEscrowBalanceAB = await mx.rpc().getBalance(treasuryEscrowAB);
  const newEscrowBalanceC = await mx.rpc().getBalance(treasuryEscrowC);
  t.true(
    isEqualToAmount(newEscrowBalanceAB, sol(0)),
    'treasury AB escrow is empty'
  );
  t.true(
    isEqualToAmount(newEscrowBalanceC, sol(0)),
    'treasury C escrow is empty'
  );
});

test.skip('[candyMachineModule] freezeTokenPayment guard: it fails to mint if the freeze escrow was not initialized', async (t) => {
  // Given a loaded Candy Machine with a freezeTokenPayment guard.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeTokenPayment: {
        amount: token(1),
        destinationAta: treasury.publicKey,
        mint: Keypair.generate().publicKey, // TODO
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

test.skip('[candyMachineModule] freezeTokenPayment guard: it fails to mint if the payer does not have enough funds', async (t) => {
  // Given a loaded Candy Machine with an initialized
  // freezeTokenPayment guard costing 5 SOLs.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeTokenPayment: {
        amount: token(5),
        destinationAta: treasury.publicKey,
        mint: Keypair.generate().publicKey, // TODO
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

test.skip('[candyMachineModule] freezeTokenPayment guard: it fails to mint if the owner is not the payer', async (t) => {
  // Given a loaded Candy Machine with an initialized freezeTokenPayment guard.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeTokenPayment: {
        amount: token(1),
        destinationAta: treasury.publicKey,
        mint: Keypair.generate().publicKey, // TODO
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
    /The payer must be the owner when using the \[freezeTokenPayment\] guard/
  );
});

test.skip('[candyMachineModule] freezeTokenPayment guard with bot tax: it charges a bot tax if something goes wrong', async (t) => {
  // Given a loaded Candy Machine with a freezeTokenPayment guard and a botTax guard.
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
      freezeTokenPayment: {
        amount: token(1),
        destinationAta: treasury.publicKey,
        mint: Keypair.generate().publicKey, // TODO
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

const createMint = async (
  mx: Metaplex,
  mintAuthority: Signer
): Promise<[Mint, TokenWithMint]> => {
  const { token: tokenWithMint } = await mx.tokens().createTokenWithMint({
    owner: mintAuthority.publicKey,
    mintAuthority,
  });

  return [tokenWithMint.mint, tokenWithMint];
};

const createTokenPayer = async (
  mx: Metaplex,
  mint: Mint,
  mintAuthority: Signer,
  amount: number
): Promise<Signer> => {
  const payer = await createWallet(mx, 10);
  await mx.tokens().mint({
    mintAddress: mint.address,
    mintAuthority,
    toOwner: payer.publicKey,
    amount: token(amount),
  });

  return payer;
};

const getFreezeEscrow = (
  mx: Metaplex,
  candyMachine: CandyMachine,
  destinationAta: { address: PublicKey }
) => {
  return mx.candyMachines().pdas().freezeEscrow({
    destination: destinationAta.address,
    candyMachine: candyMachine.address,
    candyGuard: candyMachine.candyGuard!.address,
  });
};

const getTokenBalance = async (mx: Metaplex, mint: Mint, owner: PublicKey) => {
  const tokenAccount = await mx.tokens().findTokenByAddress({
    address: mx.tokens().pdas().associatedTokenAccount({
      mint: mint.address,
      owner,
    }),
  });

  return tokenAccount.amount;
};

const getFrozenCount = async (
  mx: Metaplex,
  candyMachine: CandyMachine,
  destination: Signer
) => {
  const account = await FreezeEscrow.fromAccountAddress(
    mx.connection,
    getFreezeEscrow(mx, candyMachine, destination)
  );

  return toBigNumber(account.frozenCount).toNumber();
};

const assertFrozenCount = async (
  t: Test,
  mx: Metaplex,
  candyMachine: CandyMachine,
  destination: Signer,
  expected: number
): Promise<void> => {
  const frozenCount = await getFrozenCount(mx, candyMachine, destination);
  t.equal(frozenCount, expected, 'frozen count is correct');
};

const initFreezeEscrow = async (
  mx: Metaplex,
  candyMachine: CandyMachine,
  group?: string
) => {
  await mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'freezeTokenPayment',
    group,
    settings: {
      path: 'initialize',
      period: 15 * 24 * 3600, // 15 days.
      candyGuardAuthority: mx.identity(),
    },
  });
};

const mintNft = async (
  mx: Metaplex,
  candyMachine: CandyMachine,
  collection: { updateAuthority: Signer },
  payer?: Signer,
  group?: string
) => {
  const { nft } = await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      group,
    },
    { payer }
  );
  return nft;
};

const thawNft = async (
  mx: Metaplex,
  candyMachine: CandyMachine,
  nftMint: PublicKey,
  nftOwner: PublicKey,
  group?: string
) => {
  await mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'freezeTokenPayment',
    group,
    settings: {
      path: 'thaw',
      nftMint,
      nftOwner,
    },
  });
};

const unlockFunds = async (
  mx: Metaplex,
  candyMachine: CandyMachine,
  group?: string
) => {
  await mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'freezeTokenPayment',
    group,
    settings: {
      path: 'unlockFunds',
      candyGuardAuthority: mx.identity(),
    },
  });
};
