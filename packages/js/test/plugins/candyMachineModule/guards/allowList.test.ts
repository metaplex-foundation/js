import {
  getMerkleProof,
  getMerkleRoot,
  isEqualToAmount,
  sol,
  toBigNumber,
} from '@/index';
import { Keypair } from '@solana/web3.js';
import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';

killStuckProcess();

test('[candyMachineModule] allowList guard: it allows wallets of a predefined list to mint from the candy machine', async (t) => {
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
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      allowList: {
        merkleRoot: getMerkleRoot(allowList),
      },
    },
  });

  // When the allowed payer mints from that Candy Machine
  // by providing a valid merkle proof.
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
      guards: {
        allowList: {
          merkleProof: getMerkleProof(allowList, payer.publicKey.toBase58()),
        },
      },
    })
    .run();

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
  });
});

test.skip('[candyMachineModule] allowList guard: it forbids wallets that are not part of the predefined list to mint from the candy machine', async (t) => {
  //
});

test.skip('[candyMachineModule] allowList guard with bot tax: it charges a bot tax when trying to mint whilst not on the predefined list', async (t) => {
  // TODO
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const promise = (async () => {})();

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
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
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
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /Please provide some minting settings for the \[allowList\] guard/
  );
});
