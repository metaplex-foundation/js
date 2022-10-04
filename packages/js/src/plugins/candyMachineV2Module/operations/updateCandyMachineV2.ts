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
} from '../../nftModule';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import {
  CandyMachineV2,
  CandyMachineV2Configs,
  toCandyMachineV2Configs,
  toCandyMachineV2InstructionData,
} from '../models';
import { findCandyMachineV2CollectionPda } from '../pdas';
import { Option, TransactionBuilder, TransactionBuilderOptions } from '@/utils';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { NoInstructionsToSendError } from '@/errors';

// -----------------
// Operation
// -----------------

const Key = 'UpdateCandyMachineV2Operation' as const;

/**
 * Updates an existing Candy Machine.
 *
 * ```ts
 * await metaplex
 *   .candyMachinesV2()
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
export const updateCandyMachineV2Operation =
  useOperation<UpdateCandyMachineV2Operation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type UpdateCandyMachineV2Operation = Operation<
  typeof Key,
  UpdateCandyMachineV2Input,
  UpdateCandyMachineV2Output
>;

/**
 * @group Operations
 * @category Inputs
 */
export type UpdateCandyMachineV2Input = Partial<CandyMachineV2Configs> & {
  /**
   * The Candy Machine to update.
   * We need the full model in order to compare the current data with
   * the provided data to update. For instance, if you only want to
   * update the `price`, we need to send an instruction that updates
   * the data whilst keeping all other properties the same.
   *
   * If you want more control over how this transaction is built,
   * you may use the associated transaction builder instead using
   * `metaplex.candyMachinesV2().builders().updateCandyMachineV2({...})`.
   */
  candyMachine: CandyMachineV2;

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
export type UpdateCandyMachineV2Output = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const updateCandyMachineV2OperationHandler: OperationHandler<UpdateCandyMachineV2Operation> =
  {
    async handle(
      operation: UpdateCandyMachineV2Operation,
      metaplex: Metaplex
    ): Promise<UpdateCandyMachineV2Output> {
      const {
        candyMachine,
        authority = metaplex.identity(),
        payer = metaplex.identity(),
        newAuthority,
        newCollection,
        confirmOptions,
        ...updatableFields
      } = operation.input;

      const currentConfigs = toCandyMachineV2Configs(candyMachine);
      const instructionDataWithoutChanges = toCandyMachineV2InstructionData(
        candyMachine.address,
        currentConfigs
      );
      const instructionData = toCandyMachineV2InstructionData(
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

      const builder = updateCandyMachineV2Builder(metaplex, {
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
export type UpdateCandyMachineV2BuilderParams = {
  /**
   * The Candy Machine to update.
   * We only need a subset of the `CandyMachine` model to figure out
   * the current values for the wallet and collection addresses.
   */
  candyMachine: Pick<
    CandyMachineV2,
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
 *   .candyMachinesV2()
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
export const updateCandyMachineV2Builder = (
  metaplex: Metaplex,
  params: UpdateCandyMachineV2BuilderParams,
  options: TransactionBuilderOptions = {}
): TransactionBuilder => {
  const {
    candyMachine,
    authority = metaplex.identity(),
    payer = metaplex.identity(),
    newData,
    newAuthority,
    newCollection,
  } = params;
  const tokenMetadataProgram = metaplex.programs().getTokenMetadata().address;
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
        const collectionPda = findCandyMachineV2CollectionPda(
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
            tokenMetadataProgram,
          }),
          signers: [payer, authority],
          key: params.setCollectionInstructionKey ?? 'setCollection',
        });
      })

      // Remove collection.
      .when(shouldRemoveCollection, (builder) => {
        const collectionMint = candyMachine.collectionMintAddress as PublicKey;
        const metadata = findMetadataPda(collectionMint);
        const collectionPda = findCandyMachineV2CollectionPda(
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
            tokenMetadataProgram,
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
