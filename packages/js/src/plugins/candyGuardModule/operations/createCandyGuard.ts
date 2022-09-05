import { Metaplex } from '@/Metaplex';
import {
  Operation,
  OperationHandler,
  serializeDiscriminator,
  Signer,
  useOperation,
} from '@/types';
import { DisposableScope, TransactionBuilder } from '@/utils';
import {
  createInitializeInstruction,
  initializeInstructionDiscriminator,
} from '@metaplex-foundation/mpl-candy-guard';
import { ConfirmOptions, Keypair, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  CandyGuardsSettings,
  DefaultCandyGuardSettings,
  emptyDefaultCandyGuardSettings,
} from '../guards';
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
export type CreateCandyGuardOperation<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Operation<typeof Key, CreateCandyGuardInput<T>, CreateCandyGuardOutput<T>>;

/**
 * @group Operations
 * @category Inputs
 */
export type CreateCandyGuardInput<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = {
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

  /**
   * The settings of all guards we wish to activate.
   *
   * To deactivate a guard, set its settings to `null`.
   */
  guards: Partial<T>;

  /**
   * TODO: explain
   *
   * @defaultValue `[]`
   */
  groups?: Partial<T>[];

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
export type CreateCandyGuardOutput<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;

  /** The created Candy Guard. */
  candyGuard: CandyGuard<T>;

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
export type CreateCandyGuardBuilderParams<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Omit<CreateCandyGuardInput<T>, 'confirmOptions'> & {
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
export const createCandyGuardBuilder = <
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
>(
  metaplex: Metaplex,
  params: CreateCandyGuardBuilderParams<T>
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

  const initializeInstruction = createInitializeInstruction(
    {
      candyGuard,
      base: base.publicKey,
      authority,
      payer: payer.publicKey,
    },
    {
      data: {
        default: emptyDefaultCandyGuardSettings,
        groups: null,
      },
    }
  );

  const serializedSettings = metaplex
    .candyGuards()
    .guards()
    .serializeSettings<T>(
      params.guards,
      params.groups ?? [],
      candyGuardProgram
    );
  const discriminator = serializeDiscriminator(
    initializeInstructionDiscriminator
  );
  initializeInstruction.data = Buffer.concat([
    discriminator,
    serializedSettings,
  ]);

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
