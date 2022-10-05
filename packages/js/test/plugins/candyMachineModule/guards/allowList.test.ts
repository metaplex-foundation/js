import { Keypair } from '@solana/web3.js';
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

  // When the allowed payer mints from that Candy Machine
  // by providing a valid merkle proof.
  const { nft } = await mx.candyMachines().mint({
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    payer,
    guards: {
      allowList: {
        merkleProof: getMerkleProof(allowList, payer.publicKey.toBase58()),
      },
    },
  });

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
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

  // When the payer tries to mints from that Candy Machine.
  const promise = mx.candyMachines().mint({
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    payer,
    guards: {
      allowList: {
        merkleProof: getMerkleProof(allowList, payer.publicKey.toBase58()),
      },
    },
  });

  // Then we expect an error.
  await assertThrows(t, promise, /Address not found on the allowed list/);
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

  // When the payer tries to mints from that Candy Machine
  // by providing merkle proof of another valid wallet.
  const promise = mx.candyMachines().mint({
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    payer,
    guards: {
      allowList: {
        merkleProof: getMerkleProof(
          allowList,
          '2vjCrmEFiN9CLLhiqy8u1JPh48av8Zpzp3kNkdTtirYG'
        ),
      },
    },
  });

  // Then we expect an error.
  await assertThrows(t, promise, /Address not found on the allowed list/);
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

  // When the payer tries to mints from that Candy Machine.
  const promise = mx.candyMachines().mint({
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    payer,
    guards: {
      allowList: {
        merkleProof: getMerkleProof(allowList, payer.publicKey.toBase58()),
      },
    },
  });

  // Then we expect a bot tax error.
  await assertThrows(t, promise, /Candy Machine Bot Tax/);

  // And the payer was charged a bot tax.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(
    isEqualToAmount(payerBalance, sol(9.9), sol(0.01)),
    'payer was charged a bot tax'
  );
});

test('[candyMachineModule] allowList guard: minting settings must be provided', async (t) => {
  // Given a loaded Candy Machine with an allow list guard.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      allowList: {
        merkleRoot: getMerkleRoot([
          Keypair.generate().publicKey.toBase58(),
          Keypair.generate().publicKey.toBase58(),
          payer.publicKey.toBase58(),
        ]),
      },
    },
  });

  // When we try to mints from that Candy Machine without providing mint settings.
  const promise = mx.candyMachines().mint({
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    payer,
  });

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /Please provide some minting settings for the \[allowList\] guard/
  );
});
