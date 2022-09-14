import test from 'tape';
import { killStuckProcess, metaplex } from '../../helpers';
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

test('[candyMachineModule] find all candy machines correctly parses token mints', async (t) => {
  // Given two candy machines from authority A.
  const mx = await metaplex();
  const authorityA = Keypair.generate();

  const { token: token1 } = await mx.tokens().createTokenWithMint().run();
  const { token: token2 } = await mx.tokens().createTokenWithMint().run();

  const amount1 = token(1.0, token1.mint.decimals, token1.mint.currency.symbol);
  const amount2 = token(1.5, token2.mint.decimals, token2.mint.currency.symbol);

  const candyMachineResults = await Promise.all([
    createCandyMachine(mx, {
      authority: authorityA.publicKey,
      tokenMint: token1.mint.address,
      price: amount1,
      wallet: token1.address,
    }),
    createCandyMachine(mx, {
      authority: authorityA.publicKey,
      tokenMint: token2.mint.address,
      price: amount2,
      wallet: token2.address,
    }),
    createCandyMachine(mx, {
      authority: authorityA.publicKey,
      tokenMint: token2.mint.address,
      price: amount2,
      wallet: token2.address,
    }),
  ]);

  // When I find all candy machines
  const foundCandyMachines = await mx
    .candyMachines()
    .findAllBy({ type: 'authority', publicKey: authorityA.publicKey })
    .run();

  // Then we got three candy machines.
  t.equal(foundCandyMachines.length, 3, 'returns three accounts');

  // And they had the correct token mint addresses
  candyMachineResults.forEach((result) => {
    const foundCandyMachine = foundCandyMachines.find((foundCandyMachine) =>
      foundCandyMachine.address.equals(result.candyMachine.address)
    );
    t.ok(
      foundCandyMachine?.tokenMintAddress &&
        result.candyMachine.tokenMintAddress &&
        foundCandyMachine.tokenMintAddress.equals(
          result.candyMachine.tokenMintAddress
        ),
      'tokenMintAddress matches'
    );
  });
});
