import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import {
  CandyMachineData,
  createInitializeCandyMachineInstruction,
  Creator,
  EndSettings,
  GatekeeperConfig,
  HiddenSettings,
  WhitelistMintSettings,
} from '@metaplex-foundation/mpl-candy-machine';
import BN from 'bn.js';
import { Metaplex } from '@/Metaplex';
import {
  Operation,
  useOperation,
  Signer,
  OperationHandler,
  Amount,
  assertSameCurrencies,
  SOL,
} from '@/types';
import { Option, TransactionBuilder } from '@/utils';
import { createAccountBuilder } from '@/programs';
import { CandyMachineProgram } from './program';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import {
  getCandyMachineAccountSizeFromData,
  getCandyMachineUuidFromAddress,
} from './helpers';

const Key = 'CreateCandyMachineOperation' as const;
export const createCandyMachineOperation =
  useOperation<CreateCandyMachineOperation>(Key);
export type CreateCandyMachineOperation = Operation<
  typeof Key,
  CreateCandyMachineInput,
  CreateCandyMachineOutput
>;

export type CreateCandyMachineInput = {
  // Accounts.
  candyMachine?: Signer; // Defaults to Keypair.generate().
  payer?: Signer; // Defaults to mx.identity().
  wallet?: PublicKey; // Defaults to mx.identity().publicKey.
  authority?: PublicKey; // Defaults to mx.identity().publicKey.
  tokenMint?: Option<PublicKey>; // Default to null.

  // Data.
  price: Amount;
  sellerFeeBasisPoints: number;
  itemsAvailable: BN | number;

  // Optional Data.
  symbol?: string; // Defaults to empty string.
  maxEditionSupply?: Option<BN | number>; // Defaults to 0.
  isMutable?: boolean; // Defaults to true.
  retainAuthority?: boolean; // Defaults to true.
  goLiveDate?: Option<BN | number>; // Defaults to null.
  endSettings?: Option<EndSettings>; // Defaults to null.
  creators?: PublicKey | Creator[]; // Defaults to mx.identity().publicKey.
  hiddenSettings?: Option<HiddenSettings>; // Defaults to null.
  whitelistMintSettings?: Option<WhitelistMintSettings>; // Defaults to null.
  gatekeeper?: Option<GatekeeperConfig>; // Defaults to null.

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

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
  const creatorsParam = params.creators ?? metaplex.identity().publicKey;
  const creators = Array.isArray(creatorsParam)
    ? creatorsParam
    : [
        {
          address: creatorsParam,
          verified: false,
          share: 100,
        },
      ];

  const data: CandyMachineData = {
    uuid: getCandyMachineUuidFromAddress(candyMachine.publicKey),
    price: params.price.basisPoints,
    symbol: params.symbol ?? '',
    sellerFeeBasisPoints: params.sellerFeeBasisPoints,
    maxSupply: params.maxEditionSupply ?? 0,
    isMutable: params.isMutable ?? true,
    retainAuthority: params.retainAuthority ?? true,
    goLiveDate: params.goLiveDate ?? null,
    endSettings: params.endSettings ?? null,
    creators,
    hiddenSettings: params.hiddenSettings ?? null,
    whitelistMintSettings: params.whitelistMintSettings ?? null,
    itemsAvailable: params.itemsAvailable,
    gatekeeper: params.gatekeeper ?? null,
  };

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
        creators,
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
