import { Buffer } from 'buffer';
import test from 'tape';
import { TransactionInstruction } from '@solana/web3.js';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';
import {
  toBigNumber,
  PublicKey,
  NftWithToken,
  sol,
  isEqualToAmount,
  TransactionBuilder,
} from '@/index';

killStuckProcess();

const MEMO_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
);

test('[candyMachineModule] programGate guard: it allows minting with specified program in transaction', async (t) => {
  // Given a loaded Candy Machine with a programGate guard allowing the memo program.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      programGate: {
        additional: [MEMO_PROGRAM_ID],
      },
    },
  });

  // When we mint an NFT with a memo instruction in the transaction.
  const payer = await createWallet(mx, 10);
  const transactionBuilder = await mx.candyMachines().builders().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );
  transactionBuilder.add(createMemoInstruction());
  await mx.rpc().sendAndConfirmTransaction(transactionBuilder);

  // Then minting was successful.
  const { mintSigner, tokenAddress } = transactionBuilder.getContext();
  const nft = (await mx.nfts().findByMint({
    mintAddress: mintSigner.publicKey,
    tokenAddress,
  })) as NftWithToken;
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
  });
});

test('[candyMachineModule] programGate guard: it forbids minting with unspecified program in transaction', async (t) => {
  // Given a loaded Candy Machine with a programGate guard allowing no additional programs.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      programGate: {
        additional: [],
      },
    },
  });

  // When we try to mint an NFT with a memo instruction in the transaction.
  const payer = await createWallet(mx, 10);
  const transactionBuilder = await mx.candyMachines().builders().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );
  transactionBuilder.add(createMemoInstruction());
  const promise = mx.rpc().sendAndConfirmTransaction(transactionBuilder);

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /An unauthorized program was found in the transaction/
  );
});

test('[candyMachineModule] programGate guard: it forbids candy machine creation with more than 5 specified programs', async (t) => {
  // When we try to create a Candy Machine with a
  // programGate guard allowing more than 5 programs.
  const mx = await metaplex();
  const promise = createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      programGate: {
        additional: Array(6).fill(MEMO_PROGRAM_ID),
      },
    },
  });

  // Then we expect an error.
  await assertThrows(t, promise, /MaximumOfFiveAdditionalProgramsError/);
});

test('[candyMachineModule] programGate guard with bot tax: it charges a bot tax when minting with unspecified program in transaction', async (t) => {
  // Given a loaded Candy Machine with a botTax guard
  // and a programGate guard allowing no additional programs.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: false,
      },
      programGate: {
        additional: [],
      },
    },
  });

  // When we try to mint an NFT with a memo instruction in the transaction.
  const payer = await createWallet(mx, 10);
  const transactionBuilder = await mx.candyMachines().builders().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );
  transactionBuilder.add(createMemoInstruction());
  await mx.rpc().sendAndConfirmTransaction(transactionBuilder);

  // Then the transaction succeeded but the NFT was not minted.
  const { mintSigner, tokenAddress } = transactionBuilder.getContext();
  const promise = mx.nfts().findByMint({
    mintAddress: mintSigner.publicKey,
    tokenAddress,
  });
  await assertThrows(t, promise, /AccountNotFoundError/);

  // And the payer was charged a bot tax.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(
    isEqualToAmount(payerBalance, sol(9.9), sol(0.01)),
    'payer was charged a bot tax'
  );
});

const createMemoInstruction = (message = 'Hello World!') =>
  TransactionBuilder.make().add({
    instruction: new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(message, 'utf8'),
    }),
    signers: [],
  });
