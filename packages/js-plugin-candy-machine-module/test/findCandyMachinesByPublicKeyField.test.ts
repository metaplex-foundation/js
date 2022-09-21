import test from 'tape';
import { createCollectionNft, killStuckProcess, metaplex } from '../../helpers';
import { createCandyMachine } from './helpers';
import { Keypair } from '@solana/web3.js';
import { token } from '@/index';

killStuckProcess();

test('[candyMachineModule] find all candy machines by wallet', async (t) => {
  // Given two candy machines from wallet A.
  const mx = await metaplex();
  const walletA = Keypair.generate();
  await Promise.all([
    createCandyMachine(mx, { wallet: walletA.publicKey }),
    createCandyMachine(mx, { wallet: walletA.publicKey }),
  ]);

  // And one candy machine from wallet B.
  const walletB = Keypair.generate();
  await createCandyMachine(mx, { wallet: walletB.publicKey });

  // When I find all candy machines from wallet A.
  const candyMachines = await mx
    .candyMachines()
    .findAllBy({ type: 'wallet', publicKey: walletA.publicKey })
    .run();

  // Then we got two candy machines.
  t.equal(candyMachines.length, 2, 'returns two accounts');

  // And they both are from wallet A.
  candyMachines.forEach((candyMachine) => {
    t.ok(
      candyMachine.walletAddress.equals(walletA.publicKey),
      'wallet matches'
    );
  });
});

test('[candyMachineModule] find all candy machines by authority', async (t) => {
  // Given two candy machines from authority A.
  const mx = await metaplex();
  const authorityA = Keypair.generate();
  await Promise.all([
    createCandyMachine(mx, { authority: authorityA.publicKey }),
    createCandyMachine(mx, { authority: authorityA.publicKey }),
  ]);

  // And one candy machine from authority B.
  const authorityB = Keypair.generate();
  await createCandyMachine(mx, { authority: authorityB.publicKey });

  // When I find all candy machines from authority A.
  const candyMachines = await mx
    .candyMachines()
    .findAllBy({ type: 'authority', publicKey: authorityA.publicKey })
    .run();

  // Then we got two candy machines.
  t.equal(candyMachines.length, 2, 'returns two accounts');

  // And they both are from authority A.
  candyMachines.forEach((candyMachine) => {
    t.ok(
      candyMachine.authorityAddress.equals(authorityA.publicKey),
      'authority matches'
    );
  });
});

test('[candyMachineModule] find all candy machines correctly parses token mints and collection addresses', async (t) => {
  // Given three candy machines from authority A.
  const mx = await metaplex();
  const authority = mx.identity();

  const { token: token1 } = await mx.tokens().createTokenWithMint().run();
  const { token: token2_3 } = await mx.tokens().createTokenWithMint().run();

  const amount1 = token(1.0, token1.mint.decimals, token1.mint.currency.symbol);
  const amount2 = token(
    1.5,
    token2_3.mint.decimals,
    token2_3.mint.currency.symbol
  );

  const collection1 = await createCollectionNft(mx, {
    updateAuthority: authority,
  });
  const collection2 = await createCollectionNft(mx, {
    collectionAuthority: authority,
  });

  const candyMachineResults = await Promise.all([
    createCandyMachine(mx, {
      authority: authority,
      tokenMint: token1.mint.address,
      price: amount1,
      wallet: token1.address,
      collection: collection1.address,
    }),
    createCandyMachine(mx, {
      authority: authority,
      tokenMint: token2_3.mint.address,
      price: amount2,
      wallet: token2_3.address,
      collection: collection2.address,
    }),
    createCandyMachine(mx, {
      authority: authority,
      tokenMint: token2_3.mint.address,
      price: amount2,
      wallet: token2_3.address,
    }),
  ]);

  // When I find all candy machines
  const foundCandyMachines = await mx
    .candyMachines()
    .findAllBy({ type: 'authority', publicKey: authority.publicKey })
    .run();

  // Then we got three candy machines.
  t.equal(foundCandyMachines.length, 3, 'returns three accounts');

  // And they maintained the correct token mint addresses and collections
  const found1 = foundCandyMachines.find((machine) =>
    machine.address.equals(candyMachineResults[0].candyMachine.address)
  );
  t.ok(
    found1?.collectionMintAddress?.equals(collection1.address),
    'collectionMintAddress 1 matches'
  );
  t.ok(
    found1?.tokenMintAddress?.equals(token1.mint.address),
    'tokenMintAddress 1 matches'
  );

  const found2 = foundCandyMachines.find((machine) =>
    machine.address.equals(candyMachineResults[1].candyMachine.address)
  );
  t.ok(
    found2?.collectionMintAddress?.equals(collection2.address),
    'collectionMintAddress 2 matches'
  );
  t.ok(
    found2?.tokenMintAddress?.equals(token2_3.mint.address),
    'tokenMintAddress 2 matches'
  );

  const found3 = foundCandyMachines.find((machine) =>
    machine.address.equals(candyMachineResults[2].candyMachine.address)
  );
  t.ok(
    found3 && !found3.collectionMintAddress,
    'collectionMintAddress 3 matches'
  );
  t.ok(
    found3?.tokenMintAddress?.equals(token2_3.mint.address),
    'tokenMintAddress 3 matches'
  );
});
