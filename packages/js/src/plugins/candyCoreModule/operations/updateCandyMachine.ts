import { NoInstructionsToSendError } from '@/errors';
import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { Option, TransactionBuilder } from '@/utils';
import {
  CandyMachineData,
  createRemoveCollectionInstruction,
  createSetCollectionInstruction,
  createUpdateAuthorityInstruction,
  createUpdateCandyMachineInstruction,
} from '@metaplex-foundation/mpl-candy-machine';
import type { ConfirmOptions, PublicKey } from '@solana/web3.js';
import isEqual from 'lodash.isequal';
import {
  findCollectionAuthorityRecordPda,
  findMasterEditionV2Pda,
  findMetadataPda,
  TokenMetadataProgram,
} from '../../nftModule';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  CandyMachine,
  CandyMachineConfigs,
  toCandyMachineConfigs,
  toCandyMachineInstructionData,
} from '../models/CandyMachine';
import { findCandyMachineCollectionPda } from '../pdas';

// -----------------
// Operation
// -----------------

const Key = 'UpdateCandyMachineOperation' as const;

/**
 * Updates an existing Candy Machine.
 *
 * ```ts
 * await metaplex
 *   .candyMachines()
 *   .update({
 *     candyMachine,
 *     price: sol(2), // Updates the price only.
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const updateCandyMachineOperation =
  useOperation<UpdateCandyMachineOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type UpdateCandyMachineOperation = Operation<
  typeof Key,
  UpdateCandyMachineInput,
  UpdateCandyMachineOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type UpdateCandyMachineInput = Partial<CandyMachineConfigs> & {
  /**
   * The Candy Machine to update.
   * We need the full model in order to compare the current data with
   * the provided data to update. For instance, if you only want to
   * update the `price`, we need to send an instruction that updates
   * the data whilst keeping all other properties the same.
   *
   * If you want more control over how this transaction is built,
   * you may use the associated transaction builder instead using
   * `metaplex.candyMachines().builders().updateCandyMachine({...})`.
   */
  candyMachine: CandyMachine;

  /**
   * The Signer authorized to update the candy machine.
   *
   * @defaultValue `metaplex.identity()`
   */
  authority?: Signer;

  /**
   * The Signer that should pay for any required account storage.
   * E.g. for the collection PDA that keeps track of the Candy Machine's collection.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * The new Candy Machine authority.
   *
   * @defaultValue Defaults to not being updated.
   */
  newAuthority?: PublicKey;

  /**
   * The mint address of the new Candy Machine collection.
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
export type UpdateCandyMachineOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const updateCandyMachineOperationHandler: OperationHandler<UpdateCandyMachineOperation> =
  {
    async handle(
      operation: UpdateCandyMachineOperation,
      metaplex: Metaplex
    ): Promise<UpdateCandyMachineOutput> {
      const {
        candyMachine,
        authority = metaplex.identity(),
        payer = metaplex.identity(),
        newAuthority,
        newCollection,
        confirmOptions,
        ...updatableFields
      } = operation.input;

      const currentConfigs = toCandyMachineConfigs(candyMachine);
      const instructionDataWithoutChanges = toCandyMachineInstructionData(
        candyMachine.address,
        currentConfigs
      );
      const instructionData = toCandyMachineInstructionData(
        candyMachine.address,
        {
          ...currentConfigs,
          ...updatableFields,
        }
      );
      const { data, wallet, tokenMint } = instructionData;
      const shouldUpdateData = !isEqual(
        instructionData,
        instructionDataWithoutChanges
      );

      const builder = updateCandyMachineBuilder(metaplex, {
        candyMachine,
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
export type UpdateCandyMachineBuilderParams = {
  /**
   * The Candy Machine to update.
   * We only need a subset of the `CandyMachine` model to figure out
   * the current values for the wallet and collection addresses.
   */
  candyMachine: Pick<
    CandyMachine,
    'address' | 'walletAddress' | 'collectionMintAddress'
  >;

  /**
   * The Signer authorized to update the candy machine.
   *
   * @defaultValue `metaplex.identity()`
   */
  authority?: Signer;

  /**
   * The Signer that should pay for any required account storage.
   * E.g. for the collection PDA that keeps track of the Candy Machine's collection.
   *
   * @defaultValue `metaplex.identity()`
   */
  payer?: Signer;

  /**
   * The new Candy Machine data.
   * This includes the wallet and token mint addresses
   * which can both be updated.
   *
   * @defaultValue Defaults to not being updated.
   */
  newData?: CandyMachineData & {
    wallet: PublicKey;
    tokenMint: Option<PublicKey>;
  };

  /**
   * The new Candy Machine authority.
   *
   * @defaultValue Defaults to not being updated.
   */
  newAuthority?: PublicKey;

  /**
   * The mint address of the new Candy Machine collection.
   * When `null` is provided, the collection is removed.
   *
   * @defaultValue Defaults to not being updated.
   */
  newCollection?: Option<PublicKey>;

  /** A key to distinguish the instruction that updates the data. */
  updateInstructionKey?: string;

  /** A key to distinguish the instruction that updates the authority. */
  updateAuthorityInstructionKey?: string;

  /** A key to distinguish the instruction that sets the collection. */
  setCollectionInstructionKey?: string;

  /** A key to distinguish the instruction that removes the collection. */
  removeCollectionInstructionKey?: string;
};

/**
 * Updates an existing Candy Machine.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .candyMachines()
 *   .builders()
 *   .update({
 *     candyMachine: { address, walletAddress, collectionMintAddress },
 *     newData: {...}, // Updates the provided data.
 *   });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const updateCandyMachineBuilder = (
  metaplex: Metaplex,
  params: UpdateCandyMachineBuilderParams
): TransactionBuilder => {
  const {
    candyMachine,
    authority = metaplex.identity(),
    payer = metaplex.identity(),
    newData,
    newAuthority,
    newCollection,
  } = params;
  const shouldUpdateAuthority =
    !!newAuthority && !newAuthority.equals(authority.publicKey);
  const sameCollection =
    newCollection &&
    candyMachine.collectionMintAddress &&
    candyMachine.collectionMintAddress.equals(newCollection);
  const shouldUpdateCollection = !!newCollection && !sameCollection;
  const shouldRemoveCollection =
    !shouldUpdateCollection &&
    newCollection === null &&
    candyMachine.collectionMintAddress !== null;

  return (
    TransactionBuilder.make()

      // Update data.
      .when(!!newData, (builder) => {
        const data = newData as CandyMachineData;
        const wallet = newData?.wallet as PublicKey;
        const tokenMint = newData?.tokenMint as Option<PublicKey>;
        const updateInstruction = createUpdateCandyMachineInstruction(
          {
            candyMachine: candyMachine.address,
            authority: authority.publicKey,
            wallet,
          },
          { data }
        );

        if (tokenMint) {
          updateInstruction.keys.push({
            pubkey: tokenMint,
            isWritable: false,
            isSigner: false,
          });
        }

        return builder.add({
          instruction: updateInstruction,
          signers: [authority],
          key: params.updateInstructionKey ?? 'update',
        });
      })

      // Set or update collection.
      .when(shouldUpdateCollection, (builder) => {
        const collectionMint = newCollection as PublicKey;
        const metadata = findMetadataPda(collectionMint);
        const edition = findMasterEditionV2Pda(collectionMint);
        const collectionPda = findCandyMachineCollectionPda(
          candyMachine.address
        );
        const collectionAuthorityRecord = findCollectionAuthorityRecordPda(
          collectionMint,
          collectionPda
        );

        return builder.add({
          instruction: createSetCollectionInstruction({
            candyMachine: candyMachine.address,
            authority: authority.publicKey,
            collectionPda,
            payer: payer.publicKey,
            metadata,
            mint: collectionMint,
            edition,
            collectionAuthorityRecord,
            tokenMetadataProgram: TokenMetadataProgram.publicKey,
          }),
          signers: [payer, authority],
          key: params.setCollectionInstructionKey ?? 'setCollection',
        });
      })

      // Remove collection.
      .when(shouldRemoveCollection, (builder) => {
        const collectionMint = candyMachine.collectionMintAddress as PublicKey;
        const metadata = findMetadataPda(collectionMint);
        const collectionPda = findCandyMachineCollectionPda(
          candyMachine.address
        );
        const collectionAuthorityRecord = findCollectionAuthorityRecordPda(
          collectionMint,
          collectionPda
        );

        return builder.add({
          instruction: createRemoveCollectionInstruction({
            candyMachine: candyMachine.address,
            authority: authority.publicKey,
            collectionPda,
            metadata,
            mint: collectionMint,
            collectionAuthorityRecord,
            tokenMetadataProgram: TokenMetadataProgram.publicKey,
          }),
          signers: [authority],
          key: params.removeCollectionInstructionKey ?? 'removeCollection',
        });
      })

      // Update authority.
      .when(shouldUpdateAuthority, (builder) =>
        builder.add({
          instruction: createUpdateAuthorityInstruction(
            {
              candyMachine: candyMachine.address,
              authority: authority.publicKey,
              wallet: newData?.wallet ?? candyMachine.walletAddress,
            },
            { newAuthority: newAuthority as PublicKey }
          ),
          signers: [authority],
          key: params.updateAuthorityInstructionKey ?? 'updateAuthority',
        })
      )
  );
};
