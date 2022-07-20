import {
  ConfirmOptions,
  Keypair,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import type { Metaplex } from '@/Metaplex';
import {
  assertSol,
  Operation,
  OperationHandler,
  Signer,
  SolAmount,
  useOperation,
} from '@/types';
import { DisposableScope, TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';

const Key = 'CreateAccountOperation' as const;
export const createAccountOperation = useOperation<CreateAccountOperation>(Key);
export type CreateAccountOperation = Operation<
  typeof Key,
  CreateAccountInput,
  CreateAccountOutput
>;

export type CreateAccountInput = {
  space: number;
  lamports?: SolAmount; // Defaults to rent-exemption for given space.
  payer?: Signer; // Defaults to mx.identity().
  newAccount?: Signer; // Defaults to new generated Keypair.
  program?: PublicKey; // Defaults to System Program.
  confirmOptions?: ConfirmOptions;
};

export type CreateAccountOutput = {
  response: SendAndConfirmTransactionResponse;
  newAccount: Signer;
  lamports: SolAmount;
};

export const createAccountOperationHandler: OperationHandler<CreateAccountOperation> =
  {
    async handle(
      operation: CreateAccountOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateAccountOutput> {
      const builder = await createAccountBuilder(metaplex, operation.input);
      scope.throwIfCanceled();
      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type CreateAccountBuilderParams = Omit<
  CreateAccountInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export type CreateAccountBuilderContext = Omit<CreateAccountOutput, 'response'>;

export const createAccountBuilder = async (
  metaplex: Metaplex,
  params: CreateAccountBuilderParams
): Promise<TransactionBuilder<CreateAccountBuilderContext>> => {
  const {
    space,
    payer = metaplex.identity(),
    newAccount = Keypair.generate(),
    program = SystemProgram.programId,
  } = params;

  const lamports = params.lamports ?? (await metaplex.rpc().getRent(space));
  assertSol(lamports);

  return TransactionBuilder.make<CreateAccountBuilderContext>()
    .setFeePayer(payer)
    .setContext({
      newAccount,
      lamports,
    })
    .add({
      instruction: SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: newAccount.publicKey,
        space,
        lamports: lamports.basisPoints.toNumber(),
        programId: program,
      }),
      signers: [payer, newAccount],
      key: params.instructionKey ?? 'createAccount',
    });
};
