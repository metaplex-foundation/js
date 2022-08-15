import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { Task, TransactionBuilder } from '@/utils';
import {
  createUnverifyCollectionInstruction,
  createUnverifySizedCollectionItemInstruction,
} from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { toMetadataAccount } from '../accounts';
import { ParentCollectionMissingError } from '../errors';
import { HasMintAddress, toMintAddress } from '../helpers';
import { toMetadata } from '../models';
import type { NftBuildersClient } from '../NftBuildersClient';
import type { NftClient } from '../NftClient';
import {
  findCollectionAuthorityRecordPda,
  findMasterEditionV2Pda,
  findMetadataPda,
} from '../pdas';

// -----------------
// Clients
// -----------------

/** @internal */
export function _unverifyNftCollectionClient(
  this: NftClient,
  nftOrSft: HasMintAddress,
  input: Partial<Omit<UnverifyNftCollectionInput, 'mintAddress'>> = {}
) {
  return new Task(async (scope) => {
    const mintAddress = toMintAddress(nftOrSft);
    const collectionFromNft =
      'collection' in nftOrSft && nftOrSft.collection
        ? nftOrSft.collection.address
        : undefined;
    let collectionMintAddress =
      input.collectionMintAddress ?? collectionFromNft;

    if (!('collection' in nftOrSft) && !collectionMintAddress) {
      const metadataAddress = findMetadataPda(mintAddress);
      const metadata = toMetadata(
        toMetadataAccount(await this.metaplex.rpc().getAccount(metadataAddress))
      );
      scope.throwIfCanceled();
      collectionMintAddress = metadata.collection
        ? metadata.collection.address
        : undefined;
    }

    if (!collectionMintAddress) {
      throw new ParentCollectionMissingError(mintAddress, 'unverifyCollection');
    }

    return this.metaplex.operations().execute(
      unverifyNftCollectionOperation({
        ...input,
        mintAddress,
        collectionMintAddress,
      }),
      scope
    );
  });
}

/** @internal */
export function _unverifyNftCollectionBuildersClient(
  this: NftBuildersClient,
  input: UnverifyNftCollectionBuilderParams
) {
  return unverifyNftCollectionBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'UnverifyNftCollectionOperation' as const;
export const unverifyNftCollectionOperation =
  useOperation<UnverifyNftCollectionOperation>(Key);
export type UnverifyNftCollectionOperation = Operation<
  typeof Key,
  UnverifyNftCollectionInput,
  UnverifyNftCollectionOutput
>;

export interface UnverifyNftCollectionInput {
  // Accounts and models.
  mintAddress: PublicKey;
  collectionMintAddress: PublicKey;
  collectionAuthority?: Signer; // Defaults to mx.identity().
  payer?: Signer; // Defaults to mx.identity().

  // Data.
  isSizedCollection?: boolean; // Defaults to true.
  isDelegated?: boolean; // Defaults to false.

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface UnverifyNftCollectionOutput {
  response: SendAndConfirmTransactionResponse;
}

// -----------------
// Handler
// -----------------

export const unverifyNftCollectionOperationHandler: OperationHandler<UnverifyNftCollectionOperation> =
  {
    handle: async (
      operation: UnverifyNftCollectionOperation,
      metaplex: Metaplex
    ): Promise<UnverifyNftCollectionOutput> => {
      return unverifyNftCollectionBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type UnverifyNftCollectionBuilderParams = Omit<
  UnverifyNftCollectionInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const unverifyNftCollectionBuilder = (
  metaplex: Metaplex,
  params: UnverifyNftCollectionBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    collectionMintAddress,
    isSizedCollection = true,
    isDelegated = false,
    collectionAuthority = metaplex.identity(),
    payer = metaplex.identity(),
  } = params;

  const accounts = {
    metadata: findMetadataPda(mintAddress),
    collectionAuthority: collectionAuthority.publicKey,
    payer: payer.publicKey,
    collectionMint: collectionMintAddress,
    collection: findMetadataPda(collectionMintAddress),
    collectionMasterEditionAccount: findMasterEditionV2Pda(
      collectionMintAddress
    ),
    collectionAuthorityRecord: isDelegated
      ? findCollectionAuthorityRecordPda(
          collectionMintAddress,
          collectionAuthority.publicKey
        )
      : undefined,
  };

  const instruction = isSizedCollection
    ? createUnverifySizedCollectionItemInstruction(accounts)
    : createUnverifyCollectionInstruction(accounts);

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Unverify the collection.
      .add({
        instruction: instruction,
        signers: [payer, collectionAuthority],
        key: params.instructionKey ?? 'unverifyCollection',
      })
  );
};
