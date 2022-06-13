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
import {
  Operation,
  useOperation,
  Signer,
  OperationHandler,
  HasMetaplex,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import {
  createAccountBuilder,
  createInitializeCandyMachineInstructionWithSigners,
} from '@/programs';
import { getSpaceForCandy } from '@/programs/candyMachine/accounts/candyMachineInternals';

const Key = 'CreateCandyMachineOperation' as const;
export const createCandyMachineOperation =
  useOperation<CreateCandyMachineOperation>(Key);
export type CreateCandyMachineOperation = Operation<
  typeof Key,
  CreateCandyMachineInput,
  CreateCandyMachineOutput
>;

export type CreateCandyMachineInput = CandyMachineData & {
  // Accounts.
  candyMachineSigner?: Signer;
  payerSigner?: Signer;
  walletAddress?: PublicKey;
  authorityAddress?: PublicKey;

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

export const createCandyMachineOperationHandler: OperationHandler<CreateCandyMachineOperation> =
  {
    async handle(
      operation: CreateCandyMachineOperation,
      metaplex: Metaplex
    ): Promise<CreateCandyMachineOutput> {
      const {
        candyMachineSigner = Keypair.generate(),
        payerSigner = metaplex.identity(),
        walletAddress = payerSigner.publicKey,
        authorityAddress = payerSigner.publicKey,
        confirmOptions,
        ...candyMachineData
      } = operation.input;

      const { signature, confirmResponse } = await metaplex
        .rpc()
        .sendAndConfirmTransaction(
          await createCandyMachineBuilder({
            metaplex,
            payerSigner,
            candyMachineSigner,
            walletAddress,
            authorityAddress,
            confirmOptions,
            ...candyMachineData,
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

export type CreateCandyMachineBuilderParams = HasMetaplex &
  CandyMachineData & {
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
    candyMachineSigner,
    payerSigner,
    walletAddress,
    authorityAddress,
    createAccountInstructionKey,
    initializeCandyMachineInstructionKey,

    ...candyMachineData
  } = params;

  const space = getSpaceForCandy(candyMachineData);
  const lamports = await metaplex.connection.getMinimumBalanceForRentExemption(
    space
  );

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
      createInitializeCandyMachineInstructionWithSigners({
        data: candyMachineData,
        candyMachine: candyMachineSigner,
        payer: payerSigner,
        wallet: walletAddress,
        authority: authorityAddress,
        instructionKey: initializeCandyMachineInstructionKey,
      })
    );
};
