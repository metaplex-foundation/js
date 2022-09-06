import { NoInstructionsToSendError } from '@/errors';
import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { Option, TransactionBuilder } from '@/utils';
import type { ConfirmOptions, PublicKey } from '@solana/web3.js';
import isEqual from 'lodash.isequal';
import {
  findCollectionAuthorityRecordPda,
  findMasterEditionV2Pda,
  findMetadataPda,
  TokenMetadataProgram,
} from '../../nftModule';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { CandyGuardsSettings, DefaultCandyGuardSettings } from '../guards';
import { CandyGuard } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'UpdateCandyGuardOperation' as const;

/**
 * Updates an existing Candy Guard account.
 *
 * ```ts
 * await metaplex
 *   .candyGuards()
 *   .update({
 *     candyGuard,
 *     // TODO
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const updateCandyGuardOperation =
  useOperation<UpdateCandyGuardOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type UpdateCandyGuardOperation = Operation<
  typeof Key,
  UpdateCandyGuardInput,
  UpdateCandyGuardOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type UpdateCandyGuardInput<
  T extends CandyGuardsSettings = DefaultCandyGuardSettings
> = {
  /**
   * The Candy Guard to update.
   *
   * Here we only need the Candy Guard's address and it's current authority.
   * TODO
   */
  candyGuard: Pick<CandyGuard<T>, 'address'>;

  /**
   * The Signer authorized to update the candy Guard.
   *
   * @defaultValue `metaplex.identity()`
   */
  authority?: Signer;

  /**
   * The Signer that should pay for any required account storage.
   * E.g. for the collection PDA that keeps track of the Candy Guard's collection.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * The new Candy Guard authority.
   *
   * @defaultValue Defaults to not being updated.
   */
  newAuthority?: PublicKey;

  /**
   * The mint address of the new Candy Guard collection.
   * When `null` is provided, the collection is removed.
   *
   * @defaultValue Defaults to not being updated.
   */
  newCollection?: Option<PublicKey>;

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
    async handle(
      operation: UpdateCandyGuardOperation,
      metaplex: Metaplex
    ): Promise<UpdateCandyGuardOutput> {
      const {
        candyGuard,
        authority = metaplex.identity(),
        payer = metaplex.identity(),
        newAuthority,
        newCollection,
        confirmOptions,
        ...updatableFields
      } = operation.input;

      const builder = updateCandyGuardBuilder(metaplex, {
        candyGuard,
        authority,
        payer,
        newData: shouldUpdateData ? { ...data, wallet, tokenMint } : undefined,
        newCollection,
        newAuthority,
      });

      if (builder.isEmpty()) {
        throw new NoInstructionsToSendError(Key);
      }

      return builder.sendAndConfirm(metaplex, confirmOptions);
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
 * ```ts
 * const transactionBuilder = metaplex
 *   .candyGuards()
 *   .builders()
 *   .update({
 *     candyGuard: { address, walletAddress, collectionMintAddress },
 *     // TODO
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const updateCandyGuardBuilder = (
  metaplex: Metaplex,
  params: UpdateCandyGuardBuilderParams
): TransactionBuilder => {
  const { payer = metaplex.identity() } = params;

  return TransactionBuilder.make().setFeePayer(payer);
};
