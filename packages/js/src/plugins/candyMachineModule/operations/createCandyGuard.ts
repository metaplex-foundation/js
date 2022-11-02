import { createInitializeInstruction } from '@metaplex-foundation/mpl-candy-guard';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import { CandyGuard } from '../models/CandyGuard';
import { TransactionBuilder, TransactionBuilderOptions } from '@/utils';
import {
  makeConfirmOptionsFinalizedOnMainnet,
  Operation,
  OperationHandler,
  OperationScope,
  Pda,
  Signer,
} from '@/types';
import { Metaplex } from '@/Metaplex';

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
 *   };
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
      scope: OperationScope
    ): Promise<CreateCandyGuardOutput<T>> {
      const builder = createCandyGuardBuilder<T>(
        metaplex,
        operation.input,
        scope
      );

      const confirmOptions = makeConfirmOptionsFinalizedOnMainnet(
        metaplex,
        scope.confirmOptions
      );
      const output = await builder.sendAndConfirm(metaplex, confirmOptions);
      scope.throwIfCanceled();

      const candyGuard = await metaplex
        .candyMachines()
        .findCandyGuardByBaseAddress<T>(
          { address: output.base.publicKey },
          scope
        );

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
  params: CreateCandyGuardBuilderParams<T>,
  options: TransactionBuilderOptions = {}
): TransactionBuilder<CreateCandyGuardBuilderContext> => {
  const { programs, payer = metaplex.rpc().getDefaultFeePayer() } = options;
  const base = params.base ?? Keypair.generate();
  const authority = params.authority ?? metaplex.identity().publicKey;
  const candyGuardProgram = metaplex.programs().getCandyGuard(programs);
  const candyGuard = metaplex.candyMachines().pdas().candyGuard({
    base: base.publicKey,
    programs,
  });

  const serializedSettings = metaplex
    .candyMachines()
    .guards()
    .serializeSettings<T>(params.guards, params.groups ?? [], programs);

  return (
    TransactionBuilder.make<CreateCandyGuardBuilderContext>()
      .setFeePayer(payer)
      .setContext({ base, candyGuardAddress: candyGuard })

      // Create and initialize the candy guard account.
      .add({
        instruction: createInitializeInstruction(
          {
            candyGuard,
            base: base.publicKey,
            authority,
            payer: payer.publicKey,
          },
          { data: serializedSettings },
          candyGuardProgram.address
        ),
        signers: [base, payer],
        key: params.createCandyGuardInstructionKey ?? 'createCandyGuard',
      })
  );
};
