import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import {
  CandyMachineData,
  createInitializeCandyMachineInstruction,
  Creator,
} from '@metaplex-foundation/mpl-candy-machine';
import { Metaplex } from '@/Metaplex';
import {
  Operation,
  useOperation,
  Signer,
  OperationHandler,
  assertSameCurrencies,
  SOL,
} from '@/types';
import { Option, TransactionBuilder } from '@/utils';
import { createAccountBuilder } from '@/programs';
import { CandyMachineProgram } from './program';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { getCandyMachineAccountSizeFromData } from './helpers';
import {
  CandyMachineConfigs,
  getCandyMachineAccountDataFromConfigs,
} from './CandyMachineConfigs';

const Key = 'CreateCandyMachineOperation' as const;
export const createCandyMachineOperation =
  useOperation<CreateCandyMachineOperation>(Key);
export type CreateCandyMachineOperation = Operation<
  typeof Key,
  CreateCandyMachineInput,
  CreateCandyMachineOutput
>;

export type CreateCandyMachineInputWithoutConfigs = {
  // Accounts.
  candyMachine?: Signer; // Defaults to Keypair.generate().
  payer?: Signer; // Defaults to mx.identity().
  wallet?: PublicKey; // Defaults to mx.identity().publicKey.
  authority?: PublicKey; // Defaults to mx.identity().publicKey.
  tokenMint?: Option<PublicKey>; // Default to null.

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export type CreateCandyMachineInput = CandyMachineConfigs &
  CreateCandyMachineInputWithoutConfigs;

export type CreateCandyMachineOutput = {
  response: SendAndConfirmTransactionResponse;
  candyMachine: Signer;
  payer: Signer;
  wallet: PublicKey;
  authority: PublicKey;
  creators: Creator[];
};

export const createCandyMachineOperationHandler: OperationHandler<CreateCandyMachineOperation> =
  {
    async handle(
      operation: CreateCandyMachineOperation,
      metaplex: Metaplex
    ): Promise<CreateCandyMachineOutput> {
      const builder = await createCandyMachineBuilder(
        metaplex,
        operation.input
      );

      const response = await metaplex
        .rpc()
        .sendAndConfirmTransaction(
          builder,
          undefined,
          operation.input.confirmOptions
        );

      return {
        response,
        ...builder.getContext(),
      };
    },
  };

// -----------------
// Builder
// -----------------

export type CreateCandyMachineBuilderParams = Omit<
  CreateCandyMachineInput,
  'confirmOptions'
> & {
  createAccountInstructionKey?: string;
  initializeCandyMachineInstructionKey?: string;
};

export type CreateCandyMachineBuilderContext = Omit<
  CreateCandyMachineOutput,
  'response'
>;

export const createCandyMachineBuilder = async (
  metaplex: Metaplex,
  params: CreateCandyMachineBuilderParams
): Promise<TransactionBuilder<CreateCandyMachineBuilderContext>> => {
  const candyMachine = params.candyMachine ?? Keypair.generate();
  const payer = params.payer ?? metaplex.identity();
  const wallet = params.wallet ?? metaplex.identity().publicKey;
  const authority = params.authority ?? metaplex.identity().publicKey;
  const tokenMint = params.tokenMint ?? null;
  const data: CandyMachineData = getCandyMachineAccountDataFromConfigs(
    params,
    candyMachine.publicKey,
    metaplex.identity().publicKey
  );

  const space = getCandyMachineAccountSizeFromData(data);
  const lamports = await metaplex.rpc().getRent(space);
  const initializeInstruction = createInitializeCandyMachineInstruction(
    {
      candyMachine: candyMachine.publicKey,
      wallet,
      authority,
      payer: payer.publicKey,
    },
    { data }
  );

  if (tokenMint) {
    initializeInstruction.keys.push({
      pubkey: tokenMint,
      isWritable: false,
      isSigner: false,
    });
  } else {
    assertSameCurrencies(params.price, SOL);
  }

  return (
    TransactionBuilder.make<CreateCandyMachineBuilderContext>()
      .setContext({
        candyMachine,
        payer,
        wallet,
        authority,
        creators: data.creators,
      })

      // Create an empty account for the candy machine.
      .add(
        createAccountBuilder({
          payer,
          newAccount: candyMachine,
          space,
          lamports: lamports.basisPoints.toNumber(),
          program: CandyMachineProgram.publicKey,
          instructionKey: params.createAccountInstructionKey,
        })
      )

      // Initialize the candy machine account.
      .add({
        instruction: initializeInstruction,
        signers: [candyMachine, payer],
        key:
          params.initializeCandyMachineInstructionKey ??
          'initializeCandyMachine',
      })
  );
};
