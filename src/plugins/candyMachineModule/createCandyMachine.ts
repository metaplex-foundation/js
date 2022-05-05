import {
  ConfirmOptions,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  RpcResponseAndContext,
  SignatureResult,
} from '@solana/web3.js';
import {
  CandyMachineData,
  createInitializeCandyMachineInstruction,
  InitializeCandyMachineInstructionAccounts,
  InitializeCandyMachineInstructionArgs,
  PROGRAM_ID as CANDY_MACHINE_PROGRAM_ID,
} from '@metaplex-foundation/mpl-candy-machine';
import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, Signer, OperationHandler } from '@/types';
import { logDebug, TransactionBuilder } from '@/utils';
import { getSpaceForCandy } from '@/programs/candyMachine/accounts/candyMachineSpace';
import { createAccountBuilder } from '@/programs';

const Key = 'CreateCandyMachineOperation' as const;
export const createCandyMachineOperation = useOperation<CreateCandyMachineOperation>(Key);
export type CreateCandyMachineOperation = Operation<
  typeof Key,
  CreateCandyMachineInput,
  CreateCandyMachineOutput
>;

export type CreateCandyMachineInput = {
  // Accounts
  payerSigner: Signer;
  // solTreasuryAccount
  walletAddress: PublicKey;
  candyMachineSigner: Signer;
  authorityAddress: PublicKey;
  // Accounts
  candyMachineData: CandyMachineData;
  // Transaction Options
  confirmOptions?: ConfirmOptions;
};

export type CreateCandyMachineOutput = {
  // Accounts
  payerSigner: Signer;
  walletAddress: PublicKey;
  candyMachineSigner: Signer;
  authorityAddress: PublicKey;
  // Transaction Result
  transactionId: string;
  confirmResponse: RpcResponseAndContext<SignatureResult>;
};

export const createCandyMachineOperationHandler: OperationHandler<CreateCandyMachineOperation> = {
  async handle(
    operation: CreateCandyMachineOperation,
    metaplex: Metaplex
  ): Promise<CreateCandyMachineOutput> {
    const { payerSigner: payer = metaplex.identity() } = operation.input;
    const {
      candyMachineSigner: candyMachine = Keypair.generate(),
      walletAddress: wallet = payer.publicKey,
      authorityAddress: authority = payer.publicKey,
      candyMachineData: candyMachineAccount,
      confirmOptions,
    } = operation.input;

    const connection = metaplex.connection;
    const { signature, confirmResponse } = await metaplex.rpc().sendAndConfirmTransaction(
      await createCandyMachineBuilder({
        payerSigner: payer,
        candyMachineSigner: candyMachine,
        walletAddress: wallet,
        authorityAddress: authority,
        candyMachineData: candyMachineAccount,
        confirmOptions,
        connection,
      }),
      undefined,
      confirmOptions
    );

    return {
      // Accounts.
      payerSigner: payer,
      candyMachineSigner: candyMachine,
      walletAddress: wallet,
      authorityAddress: authority,

      // Transaction Result.
      transactionId: signature,
      confirmResponse,
    };
  },
};

export type CreateCandyMachineBuilderParams = Omit<CreateCandyMachineInput, 'confirmOptions'> & {
  confirmOptions: CreateCandyMachineInput['confirmOptions'];
  connection: Connection;
};

export const createCandyMachineBuilder = async (
  params: CreateCandyMachineBuilderParams
): Promise<TransactionBuilder> => {
  const {
    candyMachineData,
    candyMachineSigner,
    walletAddress,
    payerSigner: payer,
    authorityAddress,
    connection,
  } = params;
  const args: InitializeCandyMachineInstructionArgs = { data: candyMachineData };
  const accounts: InitializeCandyMachineInstructionAccounts = {
    candyMachine: candyMachineSigner.publicKey,
    wallet: walletAddress,
    payer: payer.publicKey,
    authority: authorityAddress,
  };
  const initCandyMachineIx = createInitializeCandyMachineInstruction(accounts, args);
  const createCandyMachine = await createCandyMachineAccountBuilder(
    payer,
    candyMachineSigner,
    candyMachineData,
    connection
  );

  return TransactionBuilder.make()
    .add(createCandyMachine)
    .add({
      instruction: initCandyMachineIx,
      signers: [payer],
      key: 'initializeCandyMachine',
    });
};

async function createCandyMachineAccountBuilder(
  payer: Signer,
  candyMachine: Signer,
  candyMachineData: CandyMachineData,
  connection: Connection
) {
  const space = getSpaceForCandy(candyMachineData);
  const lamports = await connection.getMinimumBalanceForRentExemption(space);
  logDebug(
    `Creating candy machine account with space ${space} ` +
      `and balance of ${lamports / LAMPORTS_PER_SOL} SOL`
  );
  return createAccountBuilder({
    payer,
    newAccount: candyMachine,
    space,
    lamports,
    program: CANDY_MACHINE_PROGRAM_ID,
  });
}
