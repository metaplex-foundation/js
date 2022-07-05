import test from 'tape';
import spok, { Specifications } from 'spok';
import {
  assertThrows,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import {
  CandyMachine,
  sol,
  toBigNumber,
  toDateTime,
  toUniformCreators,
} from '@/index';
import { createCandyMachine, create32BitsHash } from './helpers';
import { Keypair } from '@solana/web3.js';
import {
  EndSettingType,
  WhitelistMintMode,
} from '@metaplex-foundation/mpl-candy-machine';

killStuckProcess();

test('[candyMachineModule] it can update the data of a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    price: sol(1),
    sellerFeeBasisPoints: 100,
    itemsAvailable: toBigNumber(100),
    symbol: 'OLD',
    maxEditionSupply: toBigNumber(0),
    isMutable: true,
    retainAuthority: true,
    goLiveDate: toDateTime(1000000000),
    creators: toUniformCreators(mx.identity().publicKey),
  });

  // When we update the Candy Machine with the following data.
  const creatorA = Keypair.generate();
  const creatorB = Keypair.generate();
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      price: sol(2),
      sellerFeeBasisPoints: 200,
      itemsAvailable: toBigNumber(100), // <- Can only be updated with hidden settings.
      symbol: 'NEW',
      maxEditionSupply: toBigNumber(1),
      isMutable: false,
      retainAuthority: false,
      goLiveDate: toDateTime(2000000000),
      creators: [
        { address: creatorA.publicKey, verified: false, share: 50 },
        { address: creatorB.publicKey, verified: false, share: 50 },
      ],
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    authorityAddress: spokSamePubkey(mx.identity().publicKey),
    price: spokSameAmount(sol(2)),
    sellerFeeBasisPoints: 200,
    itemsAvailable: spokSameBignum(100),
    symbol: 'NEW',
    maxEditionSupply: spokSameBignum(1),
    isMutable: false,
    retainAuthority: false,
    goLiveDate: spokSameBignum(2000000000),
    creators: [
      {
        address: spokSamePubkey(creatorA.publicKey),
        verified: false,
        share: 50,
      },
      {
        address: spokSamePubkey(creatorB.publicKey),
        verified: false,
        share: 50,
      },
    ],
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the itemsAvailable of a candy machine with hidden settings', async (t) => {
  // Given an existing Candy Machine with hidden settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(100),
    hiddenSettings: {
      hash: create32BitsHash('cache-file'),
      name: 'mint-name',
      uri: 'https://example.com',
    },
  });

  // When we update the items available of a Candy Machine.
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      itemsAvailable: toBigNumber(200),
    })
    .run();

  // Then the Candy Machine has been updated properly.
  t.equals(updatedCandyMachine.itemsAvailable.toNumber(), 200);
});

test('[candyMachineModule] it can update the hidden settings of a candy machine', async (t) => {
  // Given an existing Candy Machine with hidden settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    hiddenSettings: {
      hash: create32BitsHash('cache-file'),
      name: 'mint-name',
      uri: 'https://example.com',
    },
  });

  // When we update these hidden settings.
  const newHash = create32BitsHash('new-cache-file');
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      hiddenSettings: {
        hash: newHash,
        name: 'new-mint-name',
        uri: 'https://example.com/new',
      },
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    hiddenSettings: {
      hash: newHash,
      name: 'new-mint-name',
      uri: 'https://example.com/new',
    },
  });
});

test('[candyMachineModule] it can add hidden settings to a candy machine that have zero items available', async (t) => {
  // Given an existing Candy Machine without hidden settings and without items.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(0),
    hiddenSettings: null,
  });

  // When we add hidden settings to the Candy Machine.
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      hiddenSettings: {
        hash: create32BitsHash('cache-file'),
        name: 'mint-name',
        uri: 'https://example.com',
      },
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    hiddenSettings: {
      hash: create32BitsHash('cache-file'),
      name: 'mint-name',
      uri: 'https://example.com',
    },
  });
});

test('[candyMachineModule] it can update the end settings of a candy machine', async (t) => {
  // Given an existing Candy Machine with end settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    endSettings: {
      endSettingType: EndSettingType.Amount,
      number: toBigNumber(100),
    },
  });

  // When we update these end settings.
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      endSettings: {
        endSettingType: EndSettingType.Date,
        date: toDateTime(1000000000),
      },
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    endSettings: {
      endSettingType: EndSettingType.Date,
      date: spokSameBignum(1000000000),
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the whitelist settings of a candy machine', async (t) => {
  // Given an existing Candy Machine with whitelist settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    whitelistMintSettings: {
      mode: WhitelistMintMode.BurnEveryTime,
      mint: Keypair.generate().publicKey,
      presale: true,
      discountPrice: sol(0.5),
    },
  });

  // When we update these whitelist settings.
  const newWhitelistMint = Keypair.generate().publicKey;
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      whitelistMintSettings: {
        mode: WhitelistMintMode.NeverBurn,
        mint: newWhitelistMint,
        presale: false,
        discountPrice: sol(0),
      },
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    whitelistMintSettings: {
      mode: WhitelistMintMode.NeverBurn,
      mint: spokSamePubkey(newWhitelistMint),
      presale: false,
      discountPrice: spokSameAmount(sol(0)),
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the gatekeeper of a candy machine', async (t) => {
  // Given an existing Candy Machine with a gatekeeper.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    gatekeeper: {
      network: Keypair.generate().publicKey,
      expireOnUse: true,
    },
  });

  // When we update the gatekeeper of the Candy Machine.
  const newGatekeeperNetwork = Keypair.generate().publicKey;
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      gatekeeper: {
        network: newGatekeeperNetwork,
        expireOnUse: false,
      },
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    gatekeeper: {
      gatekeeperNetwork: spokSamePubkey(newGatekeeperNetwork),
      expireOnUse: false,
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the authority of a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const authority = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: authority.publicKey,
  });

  // When we update the authority of the Candy Machine.
  const newAuthority = Keypair.generate();
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority,
      newAuthority: newAuthority.publicKey,
    })
    .run();

  // Then the Candy Machine has been updated properly.
  t.ok(updatedCandyMachine.authorityAddress.equals(newAuthority.publicKey));
});

test('[candyMachineModule] it cannot update the authority of a candy machine to the same authority', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const authority = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: authority.publicKey,
  });

  // When we update the authority of the Candy Machine with the same authority.
  const promise = mx
    .candyMachines()
    .update(candyMachine, {
      authority,
      newAuthority: authority.publicKey,
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /No Instructions To Send/);
});

test('[candyMachineModule] it sends no transaction if nothing has changed when updating a candy machine.', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx);

  // When we send an update without providing any changes.
  const builder = mx.candyMachines().builders().update({ candyMachine });

  // Then we expect no transaction to be sent.
  t.equals(
    builder.getInstructionsWithSigners().length,
    0,
    'has zero instructions'
  );
});

test('[candyMachineModule] it throws an error if nothing has changed when updating a candy machine.', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx);

  // When we send an update without providing any changes.
  const promise = mx.candyMachines().update(candyMachine, {}).run();

  // Then we expect an error.
  await assertThrows(t, promise, /No Instructions To Send/);
});

test('[candyMachineModule] it can update the treasury of a candy machine', async (t) => {
  // Given an existing Candy Machine with a SOL treasury.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    walletAddress: mx.identity().publicKey,
  });

  // And an existing SPL token.
  const { token } = await mx.tokens().createTokenWithMint().run();

  // When we update the treasury of the Candy Machine to use that SPL token.
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      walletAddress: token.address,
      tokenMintAddress: token.mint.address,
    })
    .run();

  // Then the Candy Machine has been updated properly.
  t.ok(updatedCandyMachine.walletAddress.equals(token.address));
  t.ok(updatedCandyMachine.tokenMintAddress?.equals(token.mint.address));
});

test('[candyMachineModule] it can update the data of a candy machine via JSON configuration', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    price: sol(1),
    itemsAvailable: toBigNumber(42),
    sellerFeeBasisPoints: 100,
    symbol: 'OLD',
    maxEditionSupply: toBigNumber(0),
    isMutable: true,
    retainAuthority: true,
    goLiveDate: toDateTime('4 Jul 2022 00:00:00 GMT'),
    walletAddress: mx.identity().publicKey,
    creators: toUniformCreators(mx.identity().publicKey),
  });

  // And an existing SPL token.
  const { token } = await mx.tokens().createTokenWithMint().run();

  // And a bunch of addresses to use when updating the candy machine.
  const newAuthority = Keypair.generate().publicKey;
  const creatorA = Keypair.generate().publicKey;
  const creatorB = Keypair.generate().publicKey;

  // When we update the Candy Machine with the following JSON configurations.
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .updateFromJsonConfig(candyMachine, {
      newAuthority,
      json: {
        price: 2,
        number: 42,
        sellerFeeBasisPoints: 200,
        solTreasuryAccount: token.address.toBase58(),
        goLiveDate: '4 Aug 2022 00:00:00 GMT',
        noRetainAuthority: true,
        noMutable: true,
        maxEditionSupply: 2,
        creators: [
          { address: creatorA.toBase58(), verified: false, share: 50 },
          { address: creatorB.toBase58(), verified: false, share: 50 },
        ],
        symbol: 'NEW',
        splTokenAccount: token.address.toBase58(),
        splToken: token.mint.address.toBase58(),
      },
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    authorityAddress: spokSamePubkey(newAuthority),
    walletAddress: spokSamePubkey(token.address),
    tokenMintAddress: spokSamePubkey(token.mint.address),
    price: spokSameAmount(sol(2)),
    itemsAvailable: spokSameBignum(42),
    sellerFeeBasisPoints: 200,
    symbol: 'NEW',
    maxEditionSupply: spokSameBignum(2),
    isMutable: false,
    retainAuthority: false,
    goLiveDate: spokSameBignum(toDateTime('4 Aug 2022 00:00:00 GMT')),
    creators: [
      { address: spokSamePubkey(creatorA), verified: false, share: 50 },
      { address: spokSamePubkey(creatorB), verified: false, share: 50 },
    ],
  } as unknown as Specifications<CandyMachine>);
});
