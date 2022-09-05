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
    .candyGuards()
    .create({ guards: emptyDefaultCandyGuardSettings })
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
    .candyGuards()
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
