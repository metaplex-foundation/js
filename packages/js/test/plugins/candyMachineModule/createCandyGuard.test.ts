import {
  CandyGuard,
  DefaultCandyGuardSettings,
  emptyDefaultCandyGuardSettings,
  findCandyGuardPda,
  sol,
  toBigNumber,
  toDateTime,
  token,
} from '@/index';
import {
  EndSettingType,
  WhitelistTokenMode,
} from '@metaplex-foundation/mpl-candy-guard';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test from 'tape';
import {
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';

killStuckProcess();

test('[candyGuardModule] create with no guards', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Candy Guard with no guards.
  const { candyGuard, base } = await mx
    .candyMachines()
    .createCandyGuard<DefaultCandyGuardSettings>({ guards: {} })
    .run();

  // Then we expect the Candy Guard account to exists with the following data.
  spok(t, candyGuard, {
    $topic: 'Candy Guard',
    model: 'candyGuard',
    address: spokSamePubkey(findCandyGuardPda(base.publicKey)),
    baseAddress: spokSamePubkey(base.publicKey),
    authorityAddress: spokSamePubkey(mx.identity().publicKey),
    accountInfo: {
      executable: false,
      owner: spokSamePubkey(mx.programs().get('CandyGuardProgram').address),
    },
    guards: emptyDefaultCandyGuardSettings,
    groups: [],
  });
});

test('[candyGuardModule] create with all guards', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Candy Guard with all guards.
  const lamportDestination = Keypair.generate().publicKey;
  const tokenMint = Keypair.generate().publicKey;
  const tokenDestination = Keypair.generate().publicKey;
  const thirdPartySigner = Keypair.generate().publicKey;
  const whitelistMint = Keypair.generate().publicKey;
  const gatekeeperNetwork = Keypair.generate().publicKey;
  const merkleRoot = Array(32).fill(42);
  const nftPaymentCollection = Keypair.generate().publicKey;
  const { candyGuard } = await mx
    .candyMachines()
    .createCandyGuard({
      guards: {
        botTax: {
          lamports: sol(0.01),
          lastInstruction: false,
        },
        lamports: {
          amount: sol(1.5),
          destination: lamportDestination,
        },
        splToken: {
          amount: token(5),
          tokenMint,
          destinationAta: tokenDestination,
        },
        liveDate: {
          date: toDateTime('2022-09-05T20:00:00.000Z'),
        },
        thirdPartySigner: {
          signerKey: thirdPartySigner,
        },
        whitelist: {
          mint: whitelistMint,
          presale: true,
          discountPrice: sol(0.5),
          mode: WhitelistTokenMode.BurnEveryTime,
        },
        gatekeeper: {
          gatekeeperNetwork,
          expireOnUse: true,
        },
        endSettings: {
          endSettingType: EndSettingType.Amount,
          number: toBigNumber(1000),
        },
        allowList: {
          merkleRoot,
        },
        mintLimit: {
          id: 1,
          limit: 5,
        },
        nftPayment: {
          burn: true,
          requiredCollection: nftPaymentCollection,
        },
      },
    })
    .run();

  // Then we expect the Candy Guard account to exists with the following data.
  spok(t, candyGuard, {
    $topic: 'Candy Guard',
    model: 'candyGuard',
    guards: {
      botTax: {
        lamports: spokSameAmount(sol(0.01)),
        lastInstruction: false,
      },
      lamports: {
        amount: spokSameAmount(sol(1.5)),
        destination: spokSamePubkey(lamportDestination),
      },
      splToken: {
        amount: spokSameAmount(token(5)),
        tokenMint: spokSamePubkey(tokenMint),
        destinationAta: spokSamePubkey(tokenDestination),
      },
      liveDate: {
        date: spokSameBignum(toDateTime('2022-09-05T20:00:00.000Z')),
      },
      thirdPartySigner: {
        signerKey: spokSamePubkey(thirdPartySigner),
      },
      whitelist: {
        mint: spokSamePubkey(whitelistMint),
        presale: true,
        discountPrice: spokSameAmount(sol(0.5)),
        mode: WhitelistTokenMode.BurnEveryTime,
      },
      gatekeeper: {
        gatekeeperNetwork: spokSamePubkey(gatekeeperNetwork),
        expireOnUse: true,
      },
      endSettings: {
        endSettingType: EndSettingType.Amount,
        number: spokSameBignum(1000),
      },
      allowList: {
        merkleRoot,
      },
      mintLimit: {
        id: 1,
        limit: 5,
      },
      nftPayment: {
        burn: true,
        requiredCollection: spokSamePubkey(nftPaymentCollection),
      },
    },
    groups: [],
  } as unknown as Specifications<CandyGuard<DefaultCandyGuardSettings>>);
});

test('[candyGuardModule] create with guard groups', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Candy Guard with no guards.
  const whitelistMint = Keypair.generate().publicKey;
  const gatekeeperNetwork = Keypair.generate().publicKey;
  const merkleRoot = Array(32).fill(42);
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
        endSettings: {
          endSettingType: EndSettingType.Date,
          date: toDateTime('2022-09-06T16:00:00.000Z'),
        },
      },
      groups: [
        {
          // First group for VIPs.
          liveDate: { date: toDateTime('2022-09-05T16:00:00.000Z') },
          lamports: { amount: sol(1), destination: mx.identity().publicKey },
          allowList: { merkleRoot },
        },
        {
          // Second group for whitelist token holders.
          liveDate: { date: toDateTime('2022-09-05T18:00:00.000Z') },
          lamports: { amount: sol(2), destination: mx.identity().publicKey },
          whitelist: {
            mint: whitelistMint,
            presale: true,
            discountPrice: null,
            mode: WhitelistTokenMode.BurnEveryTime,
          },
        },
        {
          // Third group for the public.
          liveDate: { date: toDateTime('2022-09-05T20:00:00.000Z') },
          lamports: { amount: sol(3), destination: mx.identity().publicKey },
          gatekeeper: { gatekeeperNetwork, expireOnUse: false },
        },
      ],
    })
    .run();

  // Then we expect the Candy Guard account to exists with the following data.
  spok(t, candyGuard, {
    $topic: 'Candy Guard',
    model: 'candyGuard',
    guards: {
      ...emptyDefaultCandyGuardSettings,
      botTax: {
        lamports: spokSameAmount(sol(0.01)),
        lastInstruction: false,
      },
      endSettings: {
        endSettingType: EndSettingType.Date,
        date: spokSameBignum(toDateTime('2022-09-06T16:00:00.000Z')),
      },
    },
    groups: [
      {
        ...emptyDefaultCandyGuardSettings,
        liveDate: {
          date: spokSameBignum(toDateTime('2022-09-05T16:00:00.000Z')),
        },
        lamports: {
          amount: spokSameAmount(sol(1)),
          destination: spokSamePubkey(mx.identity().publicKey),
        },
        allowList: { merkleRoot },
      },
      {
        ...emptyDefaultCandyGuardSettings,
        liveDate: {
          date: spokSameBignum(toDateTime('2022-09-05T18:00:00.000Z')),
        },
        lamports: {
          amount: spokSameAmount(sol(2)),
          destination: spokSamePubkey(mx.identity().publicKey),
        },
        whitelist: {
          mint: spokSamePubkey(whitelistMint),
          presale: true,
          discountPrice: null,
          mode: WhitelistTokenMode.BurnEveryTime,
        },
      },
      {
        ...emptyDefaultCandyGuardSettings,
        liveDate: {
          date: spokSameBignum(toDateTime('2022-09-05T20:00:00.000Z')),
        },
        lamports: {
          amount: spokSameAmount(sol(3)),
          destination: spokSamePubkey(mx.identity().publicKey),
        },
        gatekeeper: {
          gatekeeperNetwork: spokSamePubkey(gatekeeperNetwork),
          expireOnUse: false,
        },
      },
    ],
  } as unknown as Specifications<CandyGuard<DefaultCandyGuardSettings>>);
});

test('[candyGuardModule] create with explicit authority', async (t) => {
  // Given a Metaplex instance and an authority.
  const mx = await metaplex();
  const authority = Keypair.generate().publicKey;

  // When we create a new Candy Guard using that authority.
  const { candyGuard } = await mx
    .candyMachines()
    .createCandyGuard({ guards: {}, authority })
    .run();

  // Then we expect the Candy Guard's authority to be the given authority.
  spok(t, candyGuard, {
    $topic: 'Candy Guard',
    model: 'candyGuard',
    authorityAddress: spokSamePubkey(authority),
  });
});
