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
    .create({ guards: {} })
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
  const tokenMint = Keypair.generate().publicKey;
  const thirdPartySigner = Keypair.generate().publicKey;
  const whitelistMint = Keypair.generate().publicKey;
  const gatekeeperNetwork = Keypair.generate().publicKey;
  const merkleRoot = Array(32).fill(42);
  const { candyGuard } = await mx
    .candyMachines()
    .create({
      guards: {
        botTax: {
          lamports: sol(0.01),
          lastInstruction: false,
        },
        liveDate: {
          date: toDateTime('2022-09-05T20:00:00.000Z'),
        },
        lamports: {
          amount: sol(1.5),
        },
        splToken: {
          amount: token(5),
          tokenMint,
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
      liveDate: {
        date: spokSameBignum(toDateTime('2022-09-05T20:00:00.000Z')),
      },
      lamports: {
        amount: spokSameAmount(sol(1.5)),
      },
      splToken: {
        amount: spokSameAmount(token(5)),
        tokenMint: spokSamePubkey(tokenMint),
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
    .create({
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
          lamports: { amount: sol(1) },
          allowList: { merkleRoot },
        },
        {
          // Second group for whitelist token holders.
          liveDate: { date: toDateTime('2022-09-05T18:00:00.000Z') },
          lamports: { amount: sol(2) },
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
          lamports: { amount: sol(3) },
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
        lamports: { amount: spokSameAmount(sol(1)) },
        allowList: { merkleRoot },
      },
      {
        ...emptyDefaultCandyGuardSettings,
        liveDate: {
          date: spokSameBignum(toDateTime('2022-09-05T18:00:00.000Z')),
        },
        lamports: { amount: spokSameAmount(sol(2)) },
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
        lamports: { amount: spokSameAmount(sol(3)) },
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
  const authority = Keypair.generate();

  // When we create a new Candy Guard using that authority.
  const { candyGuard } = await mx
    .candyMachines()
    .create({ guards: {}, authority })
    .run();

  // Then we expect the Candy Guard's authority to be the given authority.
  spok(t, candyGuard, {
    $topic: 'Candy Guard',
    model: 'candyGuard',
    authorityAddress: spokSamePubkey(authority.publicKey),
  });
});
