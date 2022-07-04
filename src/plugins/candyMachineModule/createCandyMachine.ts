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
  toBigNumber,
  toUniformCreators,
} from '@/types';
import {
  DisposableScope,
  Option,
  RequiredKeys,
  TransactionBuilder,
} from '@/utils';
import { CandyMachineProgram } from './program';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { getCandyMachineAccountSizeFromData } from './helpers';
import {
  CandyMachine,
  CandyMachineUpdatableFields,
  toCandyMachineInstructionData,
} from './CandyMachine';

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

export type CreateCandyMachineInput = CreateCandyMachineInputWithoutConfigs &
  RequiredKeys<
    Partial<Pick<CandyMachine, CandyMachineUpdatableFields>>,
    'price' | 'sellerFeeBasisPoints' | 'itemsAvailable'
  >;

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
  const wallet = params.wallet ?? metaplex.identity().publicKey;
  const authority = params.authority ?? metaplex.identity().publicKey;
  const tokenMint = params.tokenMint ?? null;
  const data: CandyMachineData = toCandyMachineInstructionData({
    ...params,
    address: candyMachine.publicKey,
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
  });

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
        candyMachine,
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
