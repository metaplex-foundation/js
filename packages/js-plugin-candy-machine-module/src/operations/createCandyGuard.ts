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
import {
  DisposableScope,
  TransactionBuilder,
} from '@metaplex-foundation/js-core/utils';
import {
  Operation,
  OperationHandler,
  Pda,
  Program,
  serializeDiscriminator,
  Signer,
} from '@metaplex-foundation/js-core/types';
import { Metaplex } from '@metaplex-foundation/js-core/Metaplex';

// -----------------
// Operation
// -----------------

const Key = 'CreateCandyGuardOperation' as const;

/**
 * Creates a new Candy Guard account with the provided settings.
 *
 * ```ts
 * const { candyGuard } = await metaplex
 *   .candyMachines()
 *   .createCandyGuard({
 *     guards: {
 *       startDate: { date: toDateTime('2022-09-05T20:00:00.000Z') },
 *       solPayment: { amount: sol(1.5), },
 *       botTax: { lamports: sol(0.01), lastInstruction: true },
 *     },
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const createCandyGuardOperation = _createCandyGuardOperation;
// eslint-disable-next-line @typescript-eslint/naming-convention
function _createCandyGuardOperation<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
>(input: CreateCandyGuardInput<T>): CreateCandyGuardOperation<T> {
  return { key: Key, input };
}
_createCandyGuardOperation.key = Key;

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
   * @defaultValue `metaplex.identity().publicKey`
   */
  authority?: PublicKey;

  /**
   * The settings of all guards we wish to activate.
   *
   * Any guard not provided or set to `null` will be disabled.
   */
  guards: Partial<T>;

  /**
   * This parameter allows us to create multiple minting groups that have their
   * own set of requirements — i.e. guards.
   *
   * When groups are provided, the `guards` parameter becomes a set of default
   * guards that will be applied to all groups. If a specific group enables
   * a guard that is also present in the default guards, the group's guard
   * will override the default guard.
   *
   * For each group, any guard not provided or set to `null` will be disabled.
   *
   * @defaultValue `[]`
   */
  groups?: { label: string; guards: Partial<T> }[];

  /** An optional set of programs that override the registered ones. */
  programs?: Program[];

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

  /** The address of the created Candy Guard. */
  candyGuardAddress: Pda;
};

/**
 * @group Operations
 * @category Handlers
 */
export const createCandyGuardOperationHandler: OperationHandler<CreateCandyGuardOperation> =
  {
    async handle<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
      operation: CreateCandyGuardOperation<T>,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<CreateCandyGuardOutput<T>> {
      const builder = createCandyGuardBuilder<T>(metaplex, operation.input);
      const output = await builder.sendAndConfirm(
        metaplex,
        operation.input.confirmOptions
      );
      scope.throwIfCanceled();

      const candyGuard = await metaplex
        .candyMachines()
        .findCandyGuardByBaseAddress<T>({ address: output.base.publicKey })
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
 *   .candyMachines()
 *   .builders()
 *   .createCandyGuard({
 *     guards: {
 *       startDate: { date: toDateTime('2022-09-05T20:00:00.000Z') },
 *       solPayment: { amount: sol(1.5), },
 *       botTax: { lamports: sol(0.01), lastInstruction: true },
 *     },
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
  const { programs } = params;
  const base = params.base ?? Keypair.generate();
  const payer: Signer = params.payer ?? metaplex.identity();
  const authority = params.authority ?? metaplex.identity().publicKey;
  const candyGuardProgram = metaplex.programs().getCandyGuard(programs);
  const candyGuard = metaplex
    .candyMachines()
    .pdas()
    .candyGuard({ base: base.publicKey, programs });

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
    },
    candyGuardProgram.address
  );

  const serializedSettings = metaplex
    .candyMachines()
    .guards()
    .serializeSettings<T>(params.guards, params.groups ?? [], programs);
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
      .setContext({ base, candyGuardAddress: candyGuard })

      // Create and initialize the candy guard account.
      .add({
        instruction: initializeInstruction,
        signers: [base, payer],
        key: params.createCandyGuardInstructionKey ?? 'createCandyGuard',
      })
  );
};
