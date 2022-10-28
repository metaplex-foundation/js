import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import {
  CandyGuard,
  DefaultCandyGuardSettings,
  emptyDefaultCandyGuardSettings,
  sol,
  toBigNumber,
  toDateTime,
  token,
} from '@/index';

killStuckProcess();

test('[candyMachineModule] create candy guard with no guards', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Candy Guard with no guards.
  const { candyGuard, base } = await mx
    .candyMachines()
    .createCandyGuard({ guards: {} });

  // Then we expect the Candy Guard account to exists with the following data.
  spok(t, candyGuard, {
    $topic: 'Candy Guard',
    model: 'candyGuard',
    address: spokSamePubkey(
      mx.candyMachines().pdas().candyGuard({ base: base.publicKey })
    ),
    baseAddress: spokSamePubkey(base.publicKey),
    authorityAddress: spokSamePubkey(mx.identity().publicKey),
    accountInfo: {
      executable: false,
      owner: spokSamePubkey(mx.programs().getCandyGuard().address),
    },
    guards: emptyDefaultCandyGuardSettings,
    groups: [],
  });
});

test('[candyMachineModule] create candy guard with all guards', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Candy Guard with all guards.
  const lamportDestination = Keypair.generate().publicKey;
  const tokenMint = Keypair.generate().publicKey;
  const tokenDestination = Keypair.generate().publicKey;
  const thirdPartySigner = Keypair.generate().publicKey;
  const gatekeeperNetwork = Keypair.generate().publicKey;
  const merkleRoot = new Uint8Array(Array(32).fill(42));
  const tokenGateMint = Keypair.generate().publicKey;
  const tokenBurnMint = Keypair.generate().publicKey;
  const nftPaymentCollection = Keypair.generate().publicKey;
  const nftPaymentDestination = Keypair.generate().publicKey;
  const nftGateCollection = Keypair.generate().publicKey;
  const nftBurnCollection = Keypair.generate().publicKey;
  const addressGate = Keypair.generate().publicKey;
  const { candyGuard } = await mx.candyMachines().createCandyGuard({
    guards: {
      botTax: {
        lamports: sol(0.01),
        lastInstruction: false,
      },
      solPayment: {
        amount: sol(1.5),
        destination: lamportDestination,
      },
      tokenPayment: {
        amount: token(5),
        mint: tokenMint,
        destinationAta: tokenDestination,
      },
      startDate: {
        date: toDateTime('2022-09-05T20:00:00.000Z'),
      },
      thirdPartySigner: {
        signerKey: thirdPartySigner,
      },
      tokenGate: {
        mint: tokenGateMint,
        amount: token(5),
      },
      gatekeeper: {
        network: gatekeeperNetwork,
        expireOnUse: true,
      },
      endDate: {
        date: toDateTime('2022-09-06T20:00:00.000Z'),
      },
      allowList: {
        merkleRoot,
      },
      mintLimit: {
        id: 1,
        limit: 5,
      },
      nftPayment: {
        requiredCollection: nftPaymentCollection,
        destination: nftPaymentDestination,
      },
      redeemedAmount: {
        maximum: toBigNumber(100),
      },
      addressGate: {
        address: addressGate,
      },
      nftGate: {
        requiredCollection: nftGateCollection,
      },
      nftBurn: {
        requiredCollection: nftBurnCollection,
      },
      tokenBurn: {
        mint: tokenBurnMint,
        amount: token(1),
      },
    },
  });

  // Then we expect the Candy Guard account to exists with the following data.
  spok(t, candyGuard, {
    $topic: 'Candy Guard',
    model: 'candyGuard',
    guards: {
      botTax: {
        lamports: spokSameAmount(sol(0.01)),
        lastInstruction: false,
      },
      solPayment: {
        amount: spokSameAmount(sol(1.5)),
        destination: spokSamePubkey(lamportDestination),
      },
      tokenPayment: {
        amount: spokSameAmount(token(5)),
        mint: spokSamePubkey(tokenMint),
        destinationAta: spokSamePubkey(tokenDestination),
      },
      startDate: {
        date: spokSameBignum(toDateTime('2022-09-05T20:00:00.000Z')),
      },
      thirdPartySigner: {
        signerKey: spokSamePubkey(thirdPartySigner),
      },
      tokenGate: {
        mint: spokSamePubkey(tokenGateMint),
        amount: spokSameAmount(token(5)),
      },
      gatekeeper: {
        network: spokSamePubkey(gatekeeperNetwork),
        expireOnUse: true,
      },
      endDate: {
        date: spokSameBignum(toDateTime('2022-09-06T20:00:00.000Z')),
      },
      allowList: {
        merkleRoot,
      },
      mintLimit: {
        id: 1,
        limit: 5,
      },
      nftPayment: {
        requiredCollection: spokSamePubkey(nftPaymentCollection),
        destination: spokSamePubkey(nftPaymentDestination),
      },
      redeemedAmount: {
        maximum: spokSameBignum(100),
      },
      addressGate: {
        address: spokSamePubkey(addressGate),
      },
      nftGate: {
        requiredCollection: spokSamePubkey(nftGateCollection),
      },
      nftBurn: {
        requiredCollection: spokSamePubkey(nftBurnCollection),
      },
      tokenBurn: {
        mint: spokSamePubkey(tokenBurnMint),
        amount: spokSameAmount(token(1)),
      },
    },
    groups: [],
  } as unknown as Specifications<CandyGuard<DefaultCandyGuardSettings>>);
});

test('[candyMachineModule] create candy guard with guard groups', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Candy Guard with no guards.
  const tokenGateMint = Keypair.generate().publicKey;
  const gatekeeperNetwork = Keypair.generate().publicKey;
  const merkleRoot = new Uint8Array(Array(32).fill(42));
  const { candyGuard } = await mx
    .candyMachines()
    .createCandyGuard<DefaultCandyGuardSettings>({
      guards: {
        // Bot tax for all groups.
        botTax: {
          lamports: sol(0.01),
          lastInstruction: false,
        },
        // Mint finished after 24h for all groups.
        endDate: {
          date: toDateTime('2022-09-06T16:00:00.000Z'),
        },
      },
      groups: [
        {
          // First group for VIPs.
          label: 'VIP',
          guards: {
            startDate: { date: toDateTime('2022-09-05T16:00:00.000Z') },
            solPayment: {
              amount: sol(1),
              destination: mx.identity().publicKey,
            },
            allowList: { merkleRoot },
          },
        },
        {
          // Second group for whitelist token holders.
          label: 'WLIST',
          guards: {
            startDate: { date: toDateTime('2022-09-05T18:00:00.000Z') },
            solPayment: {
              amount: sol(2),
              destination: mx.identity().publicKey,
            },
            tokenGate: {
              mint: tokenGateMint,
              amount: token(1),
            },
          },
        },
        {
          // Third group for the public.
          label: 'PUBLIC',
          guards: {
            startDate: { date: toDateTime('2022-09-05T20:00:00.000Z') },
            solPayment: {
              amount: sol(3),
              destination: mx.identity().publicKey,
            },
            gatekeeper: { network: gatekeeperNetwork, expireOnUse: false },
          },
        },
      ],
    });

  // Then we expect the Candy Guard account to exist with the following data.
  spok(t, candyGuard, {
    $topic: 'Candy Guard',
    model: 'candyGuard',
    guards: {
      ...emptyDefaultCandyGuardSettings,
      botTax: {
        lamports: spokSameAmount(sol(0.01)),
        lastInstruction: false,
      },
      endDate: {
        date: spokSameBignum(toDateTime('2022-09-06T16:00:00.000Z')),
      },
    },
    groups: [
      {
        label: 'VIP',
        guards: {
          ...emptyDefaultCandyGuardSettings,
          startDate: {
            date: spokSameBignum(toDateTime('2022-09-05T16:00:00.000Z')),
          },
          solPayment: {
            amount: spokSameAmount(sol(1)),
            destination: spokSamePubkey(mx.identity().publicKey),
          },
          allowList: { merkleRoot },
        },
      },
      {
        label: 'WLIST',
        guards: {
          ...emptyDefaultCandyGuardSettings,
          startDate: {
            date: spokSameBignum(toDateTime('2022-09-05T18:00:00.000Z')),
          },
          solPayment: {
            amount: spokSameAmount(sol(2)),
            destination: spokSamePubkey(mx.identity().publicKey),
          },
          tokenGate: {
            mint: spokSamePubkey(tokenGateMint),
            amount: spokSameAmount(token(1)),
          },
        },
      },
      {
        label: 'PUBLIC',
        guards: {
          ...emptyDefaultCandyGuardSettings,
          startDate: {
            date: spokSameBignum(toDateTime('2022-09-05T20:00:00.000Z')),
          },
          solPayment: {
            amount: spokSameAmount(sol(3)),
            destination: spokSamePubkey(mx.identity().publicKey),
          },
          gatekeeper: {
            network: spokSamePubkey(gatekeeperNetwork),
            expireOnUse: false,
          },
        },
      },
    ],
  } as unknown as Specifications<CandyGuard<DefaultCandyGuardSettings>>);
});

test('[candyMachineModule] it fails to create a group with a label that is too long', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Candy Guard with a group label that is too long.
  const promise = mx.candyMachines().createCandyGuard({
    guards: {},
    groups: [
      {
        label: 'IAMALABELTHATISTOOLONG',
        guards: {},
      },
    ],
  });

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /The provided group label \[IAMALABELTHATISTOOLONG\] is too long./
  );
});

test('[candyMachineModule] create candy guard with explicit authority', async (t) => {
  // Given a Metaplex instance and an authority.
  const mx = await metaplex();
  const authority = Keypair.generate().publicKey;

  // When we create a new Candy Guard using that authority.
  const { candyGuard } = await mx
    .candyMachines()
    .createCandyGuard({ guards: {}, authority });

  // Then we expect the Candy Guard's authority to be the given authority.
  spok(t, candyGuard, {
    $topic: 'Candy Guard',
    model: 'candyGuard',
    authorityAddress: spokSamePubkey(authority),
  });
});

test('[candyMachineModule] create candy guard with explicit payer', async (t) => {
  // Given a Metaplex instance and a payer with some SOLs.
  const mx = await metaplex();
  const payer = await createWallet(mx);

  // When we create a new Candy Guard using that payer.
  const { candyGuard } = await mx
    .candyMachines()
    .createCandyGuard({ guards: {} }, { payer });

  // Then the Candy Guard was created successfully.
  spok(t, candyGuard, {
    $topic: 'Candy Guard',
    model: 'candyGuard',
  });
});
