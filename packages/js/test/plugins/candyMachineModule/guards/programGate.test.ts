import test from 'tape';
import { TransactionInstruction } from '@solana/web3.js';
import { Buffer } from 'buffer';
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
} from '@/index';

killStuckProcess();

const memoPubKey = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

test('[candyMachineModule] programGate guard: it allows minting with specified program in transaction', async (t) => {
  // Given a loaded Candy Machine with an array of additional programs in program gate
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      programGate: {
        additional: [memoPubKey],
      },
    },
  });

  // We create a transaction builder with the mint instruction
  const payer = await createWallet(mx, 10);
  const transactionBuilder = await mx.candyMachines().builders().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // We create an instruction with program specified in the program gate guard
  transactionBuilder.add({
    instruction: new TransactionInstruction({
      keys: [],
      programId: memoPubKey,
      data: Buffer.from('Hello world', 'utf8'),
    }),
    signers: [],
  });

  // Then we send and confirm transaction
  await mx.rpc().sendAndConfirmTransaction(transactionBuilder);

  const { mintSigner, tokenAddress } = transactionBuilder.getContext();

  const nft = (await mx.nfts().findByMint({
    mintAddress: mintSigner.publicKey,
    tokenAddress,
  })) as NftWithToken;

  // And confirm minting was successful
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
  });
});

test('[candyMachineModule] programGate guard: it forbids minting with unspecified program in transaction', async (t) => {
  // Given a loaded Candy Machine with an empty array of specified programs in program gate.
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

  // We create a transaction builder with the mint instruction
  const payer = await createWallet(mx, 10);
  const transactionBuilder = await mx.candyMachines().builders().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // We create an instruction with program not specified in the program gate guard
  transactionBuilder.add({
    instruction: new TransactionInstruction({
      keys: [],
      programId: memoPubKey,
      data: Buffer.from('Hello world', 'utf8'),
    }),
    signers: [],
  });

  // Then we send and confirm transaction
  const promise = mx.rpc().sendAndConfirmTransaction(transactionBuilder);

  // And confirm minting fails
  await assertThrows(
    t,
    promise,
    /An unauthorized program was found in the transaction/
  );
});

test('[candyMachineModule] programGate guard: it forbids candy machine creation with more than 5 specified programs', async (t) => {
  // Given a loaded Candy Machine with an array of specified programs in program gate > 5.
  const mx = await metaplex();
  const promise = createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      programGate: {
        additional: Array(6).fill(memoPubKey),
      },
    },
  });

  // Confirm candy machine creation fails
  await assertThrows(t, promise, /Maximum of Five Additional Programs/);
});

test('[candyMachineModule] programGate guard with bot tax: it charges a bot tax when minting with unspecified program in transaction', async (t) => {});
