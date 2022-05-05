import {
  ConfirmOptions,
  Keypair,
  PublicKey,
  RpcResponseAndContext,
  SignatureResult,
} from '@solana/web3.js';
import {
  CandyMachineData,
  PROGRAM_ID as CANDY_MACHINE_PROGRAM_ID,
} from '@metaplex-foundation/mpl-candy-machine';
import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, Signer, OperationHandler, MetaplexAware } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createAccountBuilder, initializeCandyMachineBuilder } from '@/programs';
import { getSpaceForCandy } from '@/programs/candyMachine/accounts/candyMachineSpace';

const Key = 'CreateCandyMachineOperation' as const;
export const createCandyMachineOperation = useOperation<CreateCandyMachineOperation>(Key);
export type CreateCandyMachineOperation = Operation<
  typeof Key,
  CreateCandyMachineInput,
  CreateCandyMachineOutput
>;

export type CreateCandyMachineInput = {
  // Data.
  // TODO(loris): spread data into the input directly.
  candyMachineData: CandyMachineData;

  // Accounts.
  candyMachineSigner: Signer;
  payerSigner: Signer;
  walletAddress: PublicKey;
  authorityAddress: PublicKey;

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export type CreateCandyMachineOutput = {
  // Accounts.
  candyMachineSigner: Signer;
  payerSigner: Signer;
  walletAddress: PublicKey;
  authorityAddress: PublicKey;

  // Transaction Result.
  transactionId: string;
  confirmResponse: RpcResponseAndContext<SignatureResult>;
};

export const createCandyMachineOperationHandler: OperationHandler<CreateCandyMachineOperation> = {
  async handle(
    operation: CreateCandyMachineOperation,
    metaplex: Metaplex
  ): Promise<CreateCandyMachineOutput> {
    const { payerSigner = metaplex.identity() } = operation.input;
    const {
      candyMachineSigner = Keypair.generate(),
      walletAddress = payerSigner.publicKey,
      authorityAddress = payerSigner.publicKey,
      candyMachineData,
      confirmOptions,
    } = operation.input;

    const { signature, confirmResponse } = await metaplex.rpc().sendAndConfirmTransaction(
      await createCandyMachineBuilder({
        metaplex,
        payerSigner,
        candyMachineSigner,
        walletAddress,
        authorityAddress,
        candyMachineData,
        confirmOptions,
      }),
      undefined,
      confirmOptions
    );

    return {
      // Accounts.
      payerSigner,
      candyMachineSigner,
      walletAddress,
      authorityAddress,

      // Transaction Result.
      transactionId: signature,
      confirmResponse,
    };
  },
};

export type CreateCandyMachineBuilderParams = MetaplexAware & {
  // Data.
  candyMachineData: CandyMachineData;

  // Accounts.
  candyMachineSigner: Signer;
  payerSigner: Signer;
  walletAddress: PublicKey;
  authorityAddress: PublicKey;

  // Instruction keys.
  createAccountInstructionKey?: string;
  initializeCandyMachineInstructionKey?: string;

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export const createCandyMachineBuilder = async (
  params: CreateCandyMachineBuilderParams
): Promise<TransactionBuilder> => {
  const {
    metaplex,
    candyMachineData,
    candyMachineSigner,
    walletAddress,
    payerSigner,
    authorityAddress,
    createAccountInstructionKey,
    initializeCandyMachineInstructionKey,
  } = params;

  const space = getSpaceForCandy(candyMachineData);
  const lamports = await metaplex.connection.getMinimumBalanceForRentExemption(space);

  return TransactionBuilder.make()
    .add(
      createAccountBuilder({
        payer: payerSigner,
        newAccount: candyMachineSigner,
        space,
        lamports,
        program: CANDY_MACHINE_PROGRAM_ID,
        instructionKey: createAccountInstructionKey,
      })
    )
    .add(
      initializeCandyMachineBuilder({
        data: candyMachineData,
        candyMachine: candyMachineSigner,
        payer: payerSigner,
        wallet: walletAddress,
        authority: authorityAddress,
        instructionKey: initializeCandyMachineInstructionKey,
      })
    );
};
