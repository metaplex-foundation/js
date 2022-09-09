import { Metaplex } from '@/Metaplex';
import {
  Operation,
  OperationHandler,
  serializeDiscriminator,
  Signer,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import {
  createUpdateInstruction,
  updateInstructionDiscriminator,
} from '@metaplex-foundation/mpl-candy-guard';
import type { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  CandyGuardsSettings,
  DefaultCandyGuardSettings,
  emptyDefaultCandyGuardSettings,
} from '../guards';
import { CandyGuardProgram } from '../programs';

// -----------------
// Operation
// -----------------

const Key = 'UpdateCandyGuardOperation' as const;

/**
 * Updates an existing Candy Guard account.
 *
 * Note that the provided `guards` and `groups`
 * will replace the existing ones.
 *
 * ```ts
 * await metaplex
 *   .candyMachines()
 *   .updateCandyGuard({
 *     candyGuard: candyGuard.address,
 *     guards: {
 *       liveDate: { date: toDateTime('2022-09-05T22:00:00.000Z') },
 *       lamports: { amount: sol(2), },
 *       botTax: { lamports: sol(0.01), lastInstruction: true },
 *     },
 *     groups: [],
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const updateCandyGuardOperation = <
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
>(
  input: UpdateCandyGuardInput<T>
): UpdateCandyGuardOperation<T> => ({ key: Key, input });
updateCandyGuardOperation.key = Key;

/**
 * @group Operations
 * @category Types
 */
export type UpdateCandyGuardOperation<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Operation<typeof Key, UpdateCandyGuardInput<T>, UpdateCandyGuardOutput>;

/**
 * @group Operations
 * @category Inputs
 */
export type UpdateCandyGuardInput<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = {
  /** The address of the Candy Guard to update. */
  candyGuard: PublicKey;

  /**
   * The settings of all guards we wish to activate.
   *
   * Note that this will override the existing `guards` parameter
   * so you must provide all guards you wish to activate.
   *
   * Any guard not provided or set to `null` will be disabled.
   */
  guards: Partial<T>;

  /**
   * This parameter allows us to create multiple minting groups that have their
   * own set of requirements — i.e. guards.
   *
   * Note that this will override the existing `groups` parameter
   * so you must provide all groups and guards you wish to activate.
   *
   * When groups are provided, the `guards` parameter becomes a set of default
   * guards that will be applied to all groups. If a specific group enables
   * a guard that is also present in the default guards, the group's guard
   * will override the default guard.
   *
   * For each group, any guard not provided or set to `null` will be disabled.
   *
   * You may disable groups by providing an empty array `[]`.
   */
  groups: Partial<T>[];

  /**
   * The Signer authorized to update the candy Guard.
   *
   * @defaultValue `metaplex.identity()`
   */
  authority?: Signer;

  /**
   * The Signer that should pay for any changes in the
   * Candy Guard account size. This includes receiving
   * lamports if the account size decreases.
   *
   * This account will also pay for the transaction fee by default.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * The Candy Guard program to use when updating the account.
   *
   * @defaultValue `metaplex.programs().get("CandyGuardProgram")`.
   */
  candyGuardProgram?: PublicKey;

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type UpdateCandyGuardOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const updateCandyGuardOperationHandler: OperationHandler<UpdateCandyGuardOperation> =
  {
    async handle<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
      operation: UpdateCandyGuardOperation<T>,
      metaplex: Metaplex
    ): Promise<UpdateCandyGuardOutput> {
      return updateCandyGuardBuilder<T>(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type UpdateCandyGuardBuilderParams<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = Omit<UpdateCandyGuardInput<T>, 'confirmOptions'> & {
  /** A key to distinguish the instruction that updates the candy guard. */
  updateInstructionKey?: string;
};

/**
 * Updates an existing Candy Guard account.
 *
 * Note that the provided `guards` and `groups`
 * will replace the existing ones.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .candyMachines()
 *   .builders()
 *   .updateCandyGuard({
 *     candyGuard: candyGuard.address,
 *     guards: {
 *       liveDate: { date: toDateTime('2022-09-05T22:00:00.000Z') },
 *       lamports: { amount: sol(2), },
 *       botTax: { lamports: sol(0.01), lastInstruction: true },
 *     },
 *     groups: [],
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const updateCandyGuardBuilder = <
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
>(
  metaplex: Metaplex,
  params: UpdateCandyGuardBuilderParams<T>
): TransactionBuilder => {
  const {
    candyGuard,
    guards,
    groups,
    payer = metaplex.identity(),
    authority = metaplex.identity(),
  } = params;

  const candyGuardProgram = metaplex
    .programs()
    .get<CandyGuardProgram>(params.candyGuardProgram ?? 'CandyGuardProgram');

  const updateInstruction = createUpdateInstruction(
    {
      candyGuard,
      authority: authority.publicKey,
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
    .serializeSettings<T>(guards, groups, candyGuardProgram);

  const discriminator = serializeDiscriminator(updateInstructionDiscriminator);
  updateInstruction.data = Buffer.concat([discriminator, serializedSettings]);

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Update the candy guard account.
      .add({
        instruction: updateInstruction,
        signers: [authority, payer],
        key: params.updateInstructionKey ?? 'updateCandyGuard',
      })
  );
};
