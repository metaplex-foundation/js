import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { Task, TransactionBuilder } from '@/utils';
import {
  createVerifyCollectionInstruction,
  createVerifySizedCollectionItemInstruction,
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
export function _verifyNftCollectionClient(
  this: NftClient,
  nftOrSft: HasMintAddress,
  input: Partial<Omit<VerifyNftCollectionInput, 'mintAddress'>> = {}
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
      throw new ParentCollectionMissingError(mintAddress, 'verifyCollection');
    }

    return this.metaplex.operations().execute(
      verifyNftCollectionOperation({
        ...input,
        mintAddress,
        collectionMintAddress,
      }),
      scope
    );
  });
}

/** @internal */
export function _verifyNftCollectionBuildersClient(
  this: NftBuildersClient,
  input: VerifyNftCollectionBuilderParams
) {
  return verifyNftCollectionBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'VerifyNftCollectionOperation' as const;
export const verifyNftCollectionOperation =
  useOperation<VerifyNftCollectionOperation>(Key);
export type VerifyNftCollectionOperation = Operation<
  typeof Key,
  VerifyNftCollectionInput,
  VerifyNftCollectionOutput
>;

export interface VerifyNftCollectionInput {
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

export interface VerifyNftCollectionOutput {
  response: SendAndConfirmTransactionResponse;
}

// -----------------
// Handler
// -----------------

export const verifyNftCollectionOperationHandler: OperationHandler<VerifyNftCollectionOperation> =
  {
    handle: async (
      operation: VerifyNftCollectionOperation,
      metaplex: Metaplex
    ): Promise<VerifyNftCollectionOutput> => {
      return verifyNftCollectionBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type VerifyNftCollectionBuilderParams = Omit<
  VerifyNftCollectionInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const verifyNftCollectionBuilder = (
  metaplex: Metaplex,
  params: VerifyNftCollectionBuilderParams
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
  };

  const instruction = isSizedCollection
    ? createVerifySizedCollectionItemInstruction(accounts)
    : createVerifyCollectionInstruction(accounts);

  if (isDelegated) {
    instruction.keys.push({
      pubkey: findCollectionAuthorityRecordPda(
        collectionMintAddress,
        collectionAuthority.publicKey
      ),
      isWritable: false,
      isSigner: false,
    });
  }

  return (
    TransactionBuilder.make()
      .setFeePayer(payer)

      // Verify the collection.
      .add({
        instruction: instruction,
        signers: [payer, collectionAuthority],
        key: params.instructionKey ?? 'verifyCollection',
      })
  );
};
