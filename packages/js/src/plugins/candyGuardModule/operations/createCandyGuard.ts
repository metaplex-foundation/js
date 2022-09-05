import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { DisposableScope, TransactionBuilder } from '@/utils';
import { createInitializeInstruction } from '@metaplex-foundation/mpl-candy-guard';
import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyGuard } from '../models/CandyGuard';
import { findCandyGuardPda } from '../pdas';
import { CandyGuardProgram } from '../program';

// -----------------
// Operation
// -----------------

const Key = 'CreateCandyGuardOperation' as const;

/**
 * Creates a new Candy Guard account with the provided settings.
 *
 * ```ts
 * const { candyGuard } = await metaplex
 *   .candyGuards()
 *   .create({
 *     // TODO
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const createCandyGuardOperation =
  useOperation<CreateCandyGuardOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
// TODO: Default type parameters
export type CreateCandyGuardOperation<
  GuardSettings = any,
  Guards = any
> = Operation<
  typeof Key,
  CreateCandyGuardInput<GuardSettings>,
  CreateCandyGuardOutput<Guards>
>;

/**
 * @group Operations
 * @category Inputs
 */
// TODO: Default type parameters
export type CreateCandyGuardInput<GuardSettings = any> = {
  /**
   * The "base" address of the Candy Guard to create as a Signer.
   *
   * This address will be deterministically derived to obtain the real
   * address of the Candy Guard account. It expects a brand new Keypair
   * such that its derived address has no associated account.
   *
   * @defaultValue `Keypair.generate()`
   */
  base?: Signer;

  /**
   * The Signer that should pay for the creation of the Candy Guard.
   * This includes both storage fees and the transaction fee.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * The authority that will be allowed to update the Candy Guard.
   *
   * @defaultValue `metaplex.identity()`
   */
  authority?: PublicKey;

  /** TODO */
  guards: GuardSettings;

  /**
   * The Candy Guard program to use when creating the account.
   *
   * @defaultValue `DefaultCandyGuardProgram.address`
   */
  candyGuardProgram?: PublicKey;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
// TODO: Default type parameters
export type CreateCandyGuardOutput<Guards = any> = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;

  /** The created Candy Guard. */
  candyGuard: CandyGuard<Guards>;

  /** The base address of the Candy Guard's account as a Signer. */
  base: Signer;

  /** The account that ended up paying for the Candy Guard as a Signer. */
  payer: Signer;
};

/**
 * @group Operations
 * @category Handlers
 */
export const createCandyGuardOperationHandler: OperationHandler<CreateCandyGuardOperation> =
  {
    async handle(
      operation: CreateCandyGuardOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateCandyGuardOutput> {
      const builder = createCandyGuardBuilder(metaplex, operation.input);
      const output = await builder.sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
      scope.throwIfCanceled();

      const candyGuard = await metaplex
        .candyGuards()
        .findByBaseAddress({ address: output.base.publicKey })
        .run(scope);

      return { ...output, candyGuard };
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
// TODO: Default type parameters
export type CreateCandyGuardBuilderParams<GuardSettings = any> = Omit<
  CreateCandyGuardInput<GuardSettings>,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that creates and initializes the Candy Guard account. */
  createCandyGuardInstructionKey?: string;
};

/**
 * @group Transaction Builders
 * @category Contexts
 */
export type CreateCandyGuardBuilderContext = Omit<
  CreateCandyGuardOutput,
  'response' | 'candyGuard'
>;

/**
 * Creates a new Candy Guard account with the provided settings.
 *
 * ```ts
 * const transactionBuilder = await metaplex
 *   .candyGuards()
 *   .builders()
 *   .create({
 *     // TODO
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const createCandyGuardBuilder = (
  metaplex: Metaplex,
  params: CreateCandyGuardBuilderParams
): TransactionBuilder<CreateCandyGuardBuilderContext> => {
  const base = params.base ?? Keypair.generate();
  const payer: Signer = params.payer ?? metaplex.identity();
  const authority = params.authority ?? metaplex.identity().publicKey;
  const candyGuardProgram = metaplex
    .programs()
    .get<CandyGuardProgram>(params.candyGuardProgram ?? 'CandyGuardProgram');
  const candyGuard = findCandyGuardPda(
    base.publicKey,
    candyGuardProgram.address
  );

  const availableGuards = candyGuardProgram.availableGuards;
  const guardData = availableGuards.reduce((acc, guardName) => {
    acc[guardName] = { foo: 32 };
    return acc;
  }, {} as { [key: string]: object | null });

  const initializeInstruction = createInitializeInstruction(
    {
      candyGuard,
      base: base.publicKey,
      authority,
      payer: payer.publicKey,
    },
    {
      data: {
        botTax: null,
        liveDate: null,
        lamports: null,
        splToken: null,
        thirdPartySigner: null,
        whitelist: null,
        gatekeeper: null,
        endSettings: null,
      },
    }
  );

  // TODO
  initializeInstruction.data;

  return (
    TransactionBuilder.make<CreateCandyGuardBuilderContext>()
      .setFeePayer(payer)
      .setContext({ payer, base })

      // Create and initialize the candy guard account.
      .add({
        instruction: initializeInstruction,
        signers: [base, payer],
        key: params.createCandyGuardInstructionKey ?? 'createCandyGuard',
      })
  );
};
