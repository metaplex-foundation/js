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
import { SendAndConfirmTransactionResponse } from '../../rpcModule';

// -----------------
// Operation
// -----------------

const Key = 'CreateAccountOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const createAccountOperation = useOperation<CreateAccountOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type CreateAccountOperation = Operation<
  typeof Key,
  CreateAccountInput,
  CreateAccountOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type CreateAccountInput = {
  /** The space in bytes of the account to create. */
  space: number;

  /**
   * The initial balance of the account.
   * @defaultValue By default, this will be the minumum amount of lamports
   * required for the account to be rent-exempt.
   * i.e. it will be equal to `await metaplex.rpc().getRent(space)`.
   */
  lamports?: SolAmount;

  /**
   * The Signer to use to pay for the new account and the transaction fee.
   * @defaultValue Defaults to the current identity, i.e. `metaplex.identity()`.
   */
  payer?: Signer;

  /**
   * The new account as a Signer since it will be mutated on-chain.
   * @defaultValue Defaults to a new generated Keypair, i.e. `Keypair.generate()`.
   */
  newAccount?: Signer;

  /**
   * The address of the program that should own the new account.
   * @defaultValue Defaults to the System Program.
   */
  program?: PublicKey;

  /**
   * The options to use when confirming the transaction.
   * @defaultValue Defaults to `{}`.
   */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type CreateAccountOutput = {
  /** The response from sending and confirming the sent transaction. */
  response: SendAndConfirmTransactionResponse;

  /** The new account created as a Signer. */
  newAccount: Signer;

  /** The lamports used to initialize the account's balance. */
  lamports: SolAmount;
};

/**
 * @group Operations
 * @category Handlers
 */
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

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type CreateAccountBuilderParams = Omit<
  CreateAccountInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateAccountBuilderContext = Omit<CreateAccountOutput, 'response'>;

/**
 * Note that accessing this transaction builder is asynchronous
 * because we may need to contact the cluster to get the
 * rent-exemption for the provided space.
 *
 * @group Transaction Builders
 * @category Constructors
 */
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
