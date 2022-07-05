import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import {
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
  toBigNumber,
  toUniformCreators,
} from '@/types';
import { DisposableScope, RequiredKeys, TransactionBuilder } from '@/utils';
import { CandyMachineProgram } from './program';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { getCandyMachineAccountSizeFromData } from './helpers';
import {
  CandyMachineConfigs,
  toCandyMachineInstructionData,
} from './CandyMachine';

// -----------------
// Operation
// -----------------

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

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export type CreateCandyMachineInput = CreateCandyMachineInputWithoutConfigs &
  RequiredKeys<
    Partial<CandyMachineConfigs>,
    'price' | 'sellerFeeBasisPoints' | 'itemsAvailable'
  >;

export type CreateCandyMachineOutput = {
  response: SendAndConfirmTransactionResponse;
  candyMachineSigner: Signer;
  payer: Signer;
  wallet: PublicKey;
  authority: PublicKey;
  creators: Creator[];
};

// -----------------
// Handler
// -----------------

export const createCandyMachineOperationHandler: OperationHandler<CreateCandyMachineOperation> =
  {
    async handle(
      operation: CreateCandyMachineOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateCandyMachineOutput> {
      const builder = await createCandyMachineBuilder(
        metaplex,
        operation.input
      );
      scope.throwIfCanceled();
      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
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
  const payer: Signer = params.payer ?? metaplex.identity();
  const { data, authority, wallet, tokenMint } = toCandyMachineInstructionData(
    candyMachine.publicKey,
    {
      ...params,
      authority: params.authority ?? metaplex.identity().publicKey,
      wallet: params.wallet ?? metaplex.identity().publicKey,
      tokenMint: params.tokenMint ?? null,
      symbol: params.symbol ?? '',
      maxEditionSupply: params.maxEditionSupply ?? toBigNumber(0),
      isMutable: params.isMutable ?? true,
      retainAuthority: params.retainAuthority ?? true,
      goLiveDate: params.goLiveDate ?? null,
      endSettings: params.endSettings ?? null,
      creators:
        params.creators ?? toUniformCreators(metaplex.identity().publicKey),
      hiddenSettings: params.hiddenSettings ?? null,
      whitelistMintSettings: params.whitelistMintSettings ?? null,
      gatekeeper: params.gatekeeper ?? null,
    }
  );

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
      .setFeePayer(payer)
      .setContext({
        candyMachineSigner: candyMachine,
        payer,
        wallet,
        authority,
        creators: data.creators,
      })

      // Create an empty account for the candy machine.
      .add(
        await metaplex
          .system()
          .builders()
          .createAccount({
            payer,
            newAccount: candyMachine,
            space: getCandyMachineAccountSizeFromData(data),
            program: CandyMachineProgram.publicKey,
            instructionKey:
              params.createAccountInstructionKey ?? 'createAccount',
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
