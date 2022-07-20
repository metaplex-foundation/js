import isEqual from 'lodash.isequal';
import type { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  createRemoveCollectionInstruction,
  createSetCollectionInstruction,
  createUpdateAuthorityInstruction,
  createUpdateCandyMachineInstruction,
} from '@metaplex-foundation/mpl-candy-machine';
import {
  assertSameCurrencies,
  Operation,
  OperationHandler,
  Signer,
  SOL,
  useOperation,
} from '@/types';
import { Metaplex } from '@/Metaplex';
import { Option, TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import {
  CandyMachine,
  CandyMachineConfigs,
  toCandyMachineConfigs,
  toCandyMachineInstructionData,
} from './CandyMachine';
import { NoInstructionsToSendError } from '@/errors';
import {
  findCollectionAuthorityRecordPda,
  findMasterEditionV2Pda,
  findMetadataPda,
  isLazyNft,
  isNft,
  LazyNft,
  Nft,
  TokenMetadataProgram,
} from '../nftModule';
import { findCandyMachineCollectionPda } from './pdas';

// -----------------
// Operation
// -----------------

const Key = 'UpdateCandyMachineOperation' as const;
export const updateCandyMachineOperation =
  useOperation<UpdateCandyMachineOperation>(Key);
export type UpdateCandyMachineOperation = Operation<
  typeof Key,
  UpdateCandyMachineInput,
  UpdateCandyMachineOutput
>;

export type UpdateCandyMachineInputWithoutConfigs = {
  // Models and accounts.
  candyMachine: CandyMachine;
  authority?: Signer; // Defaults to mx.identity().
  payer?: Signer; // Defaults to mx.identity().
  newAuthority?: PublicKey;
  newCollection?: Option<PublicKey | Nft | LazyNft>;

  // Transaction Options.
  confirmOptions?: ConfirmOptions;
};

export type UpdateCandyMachineInput = UpdateCandyMachineInputWithoutConfigs &
  Partial<CandyMachineConfigs>;

export type UpdateCandyMachineOutput = {
  response: SendAndConfirmTransactionResponse;
};

// -----------------
// Handler
// -----------------

export const updateCandyMachineOperationHandler: OperationHandler<UpdateCandyMachineOperation> =
  {
    async handle(
      operation: UpdateCandyMachineOperation,
      metaplex: Metaplex
    ): Promise<UpdateCandyMachineOutput> {
      const builder = updateCandyMachineBuilder(metaplex, operation.input);

      if (builder.isEmpty()) {
        throw new NoInstructionsToSendError(Key);
      }

      return builder.sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type UpdateCandyMachineBuilderParams = Omit<
  UpdateCandyMachineInput,
  'confirmOptions'
> & {
  updateInstructionKey?: string;
  updateAuthorityInstructionKey?: string;
  setCollectionInstructionKey?: string;
  removeCollectionInstructionKey?: string;
};

export const updateCandyMachineBuilder = (
  metaplex: Metaplex,
  params: UpdateCandyMachineBuilderParams
): TransactionBuilder => {
  const {
    candyMachine,
    authority = metaplex.identity(),
    payer = metaplex.identity(),
    newAuthority,
    newCollection: newCollectionParam,
    ...updatableFields
  } = params;
  const currentConfigs = toCandyMachineConfigs(candyMachine);
  const instructionDataWithoutChanges = toCandyMachineInstructionData(
    candyMachine.address,
    currentConfigs
  );
  const instructionData = toCandyMachineInstructionData(candyMachine.address, {
    ...currentConfigs,
    ...updatableFields,
  });
  const { data, wallet, tokenMint } = instructionData;
  const shouldSendUpdateInstruction = !isEqual(
    instructionData,
    instructionDataWithoutChanges
  );
  const shouldSendUpdateAuthorityInstruction =
    !!newAuthority && !newAuthority.equals(authority.publicKey);

  const newCollection =
    newCollectionParam &&
    (isNft(newCollectionParam) || isLazyNft(newCollectionParam))
      ? newCollectionParam.mintAddress
      : newCollectionParam;
  const sameCollection =
    newCollection &&
    candyMachine.collectionMintAddress &&
    candyMachine.collectionMintAddress.equals(newCollection);
  const shouldSendSetCollectionInstruction = !!newCollection && !sameCollection;
  const shouldSendRemoveCollectionInstruction =
    !shouldSendSetCollectionInstruction &&
    newCollection === null &&
    candyMachine.collectionMintAddress !== null;

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
  } else if (params.price) {
    assertSameCurrencies(params.price, SOL);
  }

  return (
    TransactionBuilder.make()

      // Update data.
      .when(shouldSendUpdateInstruction, (builder) =>
        builder.add({
          instruction: updateInstruction,
          signers: [authority],
          key: params.updateInstructionKey ?? 'update',
        })
      )

      // Update authority.
      .when(shouldSendUpdateAuthorityInstruction, (builder) =>
        builder.add({
          instruction: createUpdateAuthorityInstruction(
            {
              candyMachine: candyMachine.address,
              authority: authority.publicKey,
              wallet: candyMachine.walletAddress,
            },
            { newAuthority: newAuthority as PublicKey }
          ),
          signers: [authority],
          key: params.updateAuthorityInstructionKey ?? 'updateAuthority',
        })
      )

      // Set or update collection.
      .when(shouldSendSetCollectionInstruction, (builder) => {
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
      .when(shouldSendRemoveCollectionInstruction, (builder) => {
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
  );
};
