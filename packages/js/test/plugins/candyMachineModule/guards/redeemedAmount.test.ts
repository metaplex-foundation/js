import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import {
  assertMintingWasSuccessful,
  createCandyMachine,
  SEQUENTIAL_ITEM_SETTINGS,
} from '../helpers';
import { isEqualToAmount, sol, toBigNumber } from '@/index';

killStuckProcess();

test('[candyMachineModule] redeemedAmount guard: it allows minting until a threshold of NFTs have been redeemed', async (t) => {
  // Given a loaded Candy Machine with a redeemedAmount guard with a threshold of 1 NFT.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    itemSettings: SEQUENTIAL_ITEM_SETTINGS,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
    ],
    guards: {
      redeemedAmount: {
        maximum: toBigNumber(1),
      },
    },
  });

  // When we mint its first item.
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
});

test('[candyMachineModule] redeemedAmount guard: it forbids minting once the redeemed threshold has been reached', async (t) => {
  // Given a loaded Candy Machine with a redeemedAmount guard with a threshold of 1 NFT.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    itemSettings: SEQUENTIAL_ITEM_SETTINGS,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
    ],
    guards: {
      redeemedAmount: {
        maximum: toBigNumber(1),
      },
    },
  });

  // And assuming its first item has already been minted.
  await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer: await createWallet(mx, 10) }
  );

  // When we try to mint its second item.
  const payer = await createWallet(mx, 10);
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /Current redemeed items is at the set maximum amount/
  );
});

test('[candyMachineModule] redeemedAmount guard with bot tax: it charges a bot tax when trying to mint once the threshold has been reached', async (t) => {
  // Given a loaded Candy Machine with a bot tax guard
  // and a redeemedAmount guard with a threshold of 1 NFT.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    itemSettings: SEQUENTIAL_ITEM_SETTINGS,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
    ],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      redeemedAmount: {
        maximum: toBigNumber(1),
      },
    },
  });

  // And assuming its first item has already been minted.
  await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer: await createWallet(mx, 10) }
  );

  // When we try to mint its second item.
  const payer = await createWallet(mx, 10);
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
