import {
  isEqualToAmount,
  isLessThanAmount,
  now,
  sol,
  toBigNumber,
  toDateTime,
} from '@/index';
import { Keypair } from '@solana/web3.js';
import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../helpers';
import {
  assertMintingWasSuccessful,
  create32BitsHash,
  createCandyMachine,
} from './helpers';

killStuckProcess();

test('[candyMachineModule] it can mint from a Candy Machine directly as the mint authority', async (t) => {
  // Given a loaded Candy Machine with a mint authority.
  const mx = await metaplex();
  const candyMachineAuthority = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    withoutCandyGuard: true,
    authority: candyMachineAuthority,
    itemsAvailable: toBigNumber(1),
    symbol: 'CANDY',
    sellerFeeBasisPoints: 123,
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
  });

  // When we mint an NFT from the candy machine using the mint authority.
  const owner = Keypair.generate().publicKey;
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      mintAuthority: candyMachineAuthority,
      owner,
    })
    .run();

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner,
  });
});

test('[candyMachineModule] it cannot mint from a Candy Machine directly if not the mint authority', async (t) => {
  // Given a loaded Candy Machine with a mint authority.
  const mx = await metaplex();
  const candyMachineAuthority = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    withoutCandyGuard: true,
    authority: candyMachineAuthority,
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
  });

  // When we try to mint an NFT using another mint authority.
  const wrongMintAuthority = Keypair.generate();
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      mintAuthority: wrongMintAuthority,
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /A has_one constraint was violated/);
});

test('[candyMachineModule] it can mint from a Candy Guard with no guards', async (t) => {
  // Given a loaded Candy Machine with a Candy Guard.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    symbol: 'CANDY',
    sellerFeeBasisPoints: 123,
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
  });

  // When we mint an NFT from this candy machine.
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    })
    .run();

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: mx.identity().publicKey,
  });
});

test('[candyMachineModule] it can mint from a Candy Guard with some guards', async (t) => {
  // Given a loaded Candy Machine with some guards.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      startDate: {
        date: toDateTime(now().subn(3600 * 24)), // Yesterday.
      },
      solPayment: {
        amount: sol(1),
        destination: treasury.publicKey,
      },
    },
  });

  // When we mint an NFT from this candy machine.
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    })
    .run();

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: mx.identity().publicKey,
  });
});

test("[candyMachineModule] it throws a bot tax error if minting succeeded but we couldn't find the mint NFT", async (t) => {
  // Given a loaded Candy Machine with a bot tax guard and a live date in the future.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    authority: Keypair.generate(),
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      startDate: {
        date: toDateTime(now().addn(3600 * 24)), // Tomorrow.
      },
    },
  });

  // When we try to mint an NFT using another mint authority.
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    })
    .run();

  // Then we expect a Box Tax error.
  await assertThrows(t, promise, /Candy Machine Bot Tax/);
});

test('[candyMachineModule] it can mint from a Candy Guard with groups', async (t) => {
  // Given a loaded Candy Machine with some two guard groups: GROUP1 and GROUP2,
  // Such that GROUP1 is mintable and GROUP2 is not yet.
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
      solPayment: {
        amount: sol(1),
        destination: treasury.publicKey,
      },
    },
    groups: [
      {
        label: 'GROUP1',
        guards: {
          startDate: {
            date: toDateTime(now().subn(3600 * 24)), // Yesterday.
          },
        },
      },
      {
        label: 'GROUP2',
        guards: {
          startDate: {
            date: toDateTime(now().subn(3600 * 24)), // Tomorrow.
          },
        },
      },
    ],
  });

  // When we mint an NFT from this candy machine using GROUP1.
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      group: 'GROUP1',
    })
    .run();

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: mx.identity().publicKey,
  });
});

test('[candyMachineModule] it cannot mint using the default guards if the Candy Guard has groups', async (t) => {
  // Given a loaded Candy Machine with guard groups.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    authority: Keypair.generate(),
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
    },
    groups: [
      {
        label: 'GROUP1',
        guards: {
          startDate: {
            date: toDateTime(now().subn(3600 * 24)), // Yesterday.
          },
        },
      },
      {
        label: 'GROUP2',
        guards: {
          startDate: {
            date: toDateTime(now().subn(3600 * 24)), // Tomorrow.
          },
        },
      },
    ],
  });

  // When we try to mint an NFT using the default guards.
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      group: null,
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /Minting Requires Group Label/);
});

test('[candyMachineModule] it cannot mint using a labelled group if the Candy Guard has no groups', async (t) => {
  // Given a loaded Candy Machine with no guard groups.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
    },
  });

  // When we try to mint an NFT using a group that does not exist.
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      group: 'GROUPX',
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /Minting Must Not Use Group/);
});

test('[candyMachineModule] it cannot mint from a Candy Guard with groups if the provided group label does not exist', async (t) => {
  // Given a loaded Candy Machine with guard groups.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    authority: Keypair.generate(),
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
    },
    groups: [
      {
        label: 'GROUP1',
        guards: {
          startDate: {
            date: toDateTime(now().subn(3600 * 24)), // Yesterday.
          },
        },
      },
      {
        label: 'GROUP2',
        guards: {
          startDate: {
            date: toDateTime(now().subn(3600 * 24)), // Tomorrow.
          },
        },
      },
    ],
  });

  // When we try to mint an NFT using a group that does not exist.
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      group: 'GROUP3',
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /Minting Group Selected Does Not Exist/);
});

test('[candyMachineModule] it can mint from a candy machine using an explicit payer', async (t) => {
  // Given a loaded Candy Machine without a Candy Guard.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    withoutCandyGuard: true,
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
  });

  // And an explicit payer with 10 SOL.
  const payer = await createWallet(mx, 10);
  t.ok(
    isEqualToAmount(await mx.rpc().getBalance(payer.publicKey), sol(10)),
    'payer has 10 SOL'
  );

  // When we mint from it using this payer.
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
    })
    .run();

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
  });

  // And the payer's balance has been reduced.
  t.ok(
    isLessThanAmount(await mx.rpc().getBalance(payer.publicKey), sol(10)),
    'payer has less than 10 SOL'
  );
});

test('[candyMachineModule] it cannot mint from an empty candy machine', async (t) => {
  // Given an empty Candy Machine with no Candy Guard.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    withoutCandyGuard: true,
    itemsAvailable: toBigNumber(0),
  });

  // When we try to mint from it.
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /Candy machine is empty/);
});

test('[candyMachineModule] it cannot mint from a candy machine that is not fully loaded', async (t) => {
  // Given a half-loaded Candy Machine with no Candy Guard.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    withoutCandyGuard: true,
    itemsAvailable: toBigNumber(2),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
  });

  // When we try to mint from it.
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /Not all config lines were added to the candy machine/
  );
});

test('[candyMachineModule] it cannot mint from a candy machine that has been fully minted', async (t) => {
  // Given a loaded Candy Machine with only one item and no Candy Guard.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    withoutCandyGuard: true,
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
  });

  // And given its only item has already been minted.
  await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    })
    .run();

  // When we try to mint from it again.
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /Candy machine is empty/);
});

test('[candyMachineModule] it can mint from a candy machine using hidden settings', async (t) => {
  // Given a loaded Candy Machine with hidden settings.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    withoutCandyGuard: true,
    itemsAvailable: toBigNumber(100_000_000),
    itemSettings: {
      type: 'hidden',
      name: 'Degen $ID+1$',
      uri: 'https://example.com/degen/$ID+1$',
      hash: create32BitsHash('some-file'),
    },
  });

  // When we mint from it.
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    })
    .run();

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: mx.identity().publicKey,
  });
});
