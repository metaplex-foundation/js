import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';
import {
  getMerkleProof,
  getMerkleRoot,
  isEqualToAmount,
  NftWithToken,
  sol,
  toBigNumber,
} from '@/index';

killStuckProcess();

test('[candyMachineModule] allowList guard: it allows minting from wallets of a predefined list', async (t) => {
  // Given the payer that will be minting is part of an allow list.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const allowList = [
    payer.publicKey.toBase58(),
    'Ur1CbWSGsXCdedknRbJsEk7urwAvu1uddmQv51nAnXB',
    'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS',
    '2vjCrmEFiN9CLLhiqy8u1JPh48av8Zpzp3kNkdTtirYG',
    'AT8nPwujHAD14cLojTcB1qdBzA1VXnT6LVGuUd6Y73Cy',
  ];

  // And given a loaded Candy Machine with the allow list guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      allowList: {
        merkleRoot: getMerkleRoot(allowList),
      },
    },
  });

  // When we verify the payer first by providing a valid merkle proof.
  await mx.candyMachines().callGuardRoute(
    {
      candyMachine,
      guard: 'allowList',
      settings: {
        path: 'proof',
        merkleProof: getMerkleProof(allowList, payer.publicKey.toBase58()),
      },
    },
    { payer }
  );

  // And then mint from the Candy Machine using this payer.
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
});

test('[candyMachineModule] allowList guard: it is possible to verify the proof and mint in the same transaction if there is space', async (t) => {
  // Given the identity is part of an allow list.
  const mx = await metaplex();
  const allowList = [
    mx.identity().publicKey.toBase58(),
    'Ur1CbWSGsXCdedknRbJsEk7urwAvu1uddmQv51nAnXB',
    'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS',
  ];

  // And given a loaded Candy Machine with the allow list guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      allowList: {
        merkleRoot: getMerkleRoot(allowList),
      },
    },
  });

  // When we verify the identity using a valid merkle proof
  // and mint from the Candy Machine at the same time.
  const verifyBuilder = mx
    .candyMachines()
    .builders()
    .callGuardRoute({
      candyMachine,
      guard: 'allowList',
      settings: {
        path: 'proof',
        merkleProof: getMerkleProof(
          allowList,
          mx.identity().publicKey.toBase58()
        ),
      },
    });
  const mintBuilder = await mx.candyMachines().builders().mint({
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
  });
  await mx.rpc().sendAndConfirmTransaction(verifyBuilder.add(mintBuilder));

  // Then minting was successful.
  const { mintSigner, tokenAddress } = mintBuilder.getContext();
  const nft = (await mx.nfts().findByMint({
    mintAddress: mintSigner.publicKey,
    tokenAddress,
  })) as NftWithToken;
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: mx.identity().publicKey,
  });
});

test('[candyMachineModule] allowList guard: it forbids minting from wallets that are not part of a predefined list', async (t) => {
  // Given the payer that will be minting is not part of the allow list.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const allowList = [
    '2vjCrmEFiN9CLLhiqy8u1JPh48av8Zpzp3kNkdTtirYG',
    'AT8nPwujHAD14cLojTcB1qdBzA1VXnT6LVGuUd6Y73Cy',
  ];

  // And given a loaded Candy Machine with the allow list guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      allowList: {
        merkleRoot: getMerkleRoot(allowList),
      },
    },
  });

  // When the payer provides an invalid merkle proof.
  const verifyPromise = mx.candyMachines().callGuardRoute(
    {
      candyMachine,
      guard: 'allowList',
      settings: {
        path: 'proof',
        merkleProof: getMerkleProof(allowList, payer.publicKey.toBase58()),
      },
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, verifyPromise, /Address not found on the allowed list/);

  // And when the payer still tries to mints after the verification failed.
  const mintPromise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we also expect an error.
  await assertThrows(t, mintPromise, /Missing allowed list proof/);
});

test('[candyMachineModule] allowList guard: it forbids minting from wallets that are providing the wrong proof', async (t) => {
  // Given the payer that will be minting is not part of the allow list.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const allowList = [
    '2vjCrmEFiN9CLLhiqy8u1JPh48av8Zpzp3kNkdTtirYG',
    'AT8nPwujHAD14cLojTcB1qdBzA1VXnT6LVGuUd6Y73Cy',
  ];

  // And given a loaded Candy Machine with the allow list guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      allowList: {
        merkleRoot: getMerkleRoot(allowList),
      },
    },
  });

  // When the payer tries to verify itself by providing
  // the merkle proof of another valid wallet.
  const verifyPromise = mx.candyMachines().callGuardRoute(
    {
      candyMachine,
      guard: 'allowList',
      settings: {
        path: 'proof',
        merkleProof: getMerkleProof(
          allowList,
          '2vjCrmEFiN9CLLhiqy8u1JPh48av8Zpzp3kNkdTtirYG'
        ),
      },
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, verifyPromise, /Address not found on the allowed list/);

  // And when the payer still tries to mints after the verification failed.
  const mintPromise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we also expect an error.
  await assertThrows(t, mintPromise, /Missing allowed list proof/);
});

test('[candyMachineModule] allowList guard with bot tax: it charges a bot tax when trying to mint whilst not on the predefined list', async (t) => {
  // Given the payer that will be minting is not part of the allow list.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const allowList = [
    '2vjCrmEFiN9CLLhiqy8u1JPh48av8Zpzp3kNkdTtirYG',
    'AT8nPwujHAD14cLojTcB1qdBzA1VXnT6LVGuUd6Y73Cy',
  ];

  // And given a loaded Candy Machine with a allow list guard and a box tax guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      allowList: {
        merkleRoot: getMerkleRoot(allowList),
      },
    },
  });

  // When the payer tries to mints from that Candy Machine
  // without having been verified via the route instruction.
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we expect a bot tax error.
  await assertThrows(t, promise, /CandyMachineBotTaxError/);

  // And the payer was charged a bot tax.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(
    isEqualToAmount(payerBalance, sol(9.9), sol(0.01)),
    'payer was charged a bot tax'
  );
});
