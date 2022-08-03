import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  createSignMetadataInstruction,
  createVerifyCollectionInstruction,
  createVerifySizedCollectionItemInstruction,
} from '@metaplex-foundation/mpl-token-metadata';
import { useOperation, Operation, Signer, OperationHandler } from '@/types';
import { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { findCollectionAuthorityRecordPda, findMetadataPda } from './pdas';
import type { NftClient } from './NftClient';
import type { NftBuildersClient } from './NftBuildersClient';
import { HasMintAddress, toMintAddress } from './helpers';
import { Nft } from './Nft';

// -----------------
// Clients
// -----------------

/** @internal */
export function _verifyNftCollectionClient(
  this: NftClient,
  nftOrSft: HasMintAddress,
  creator?: Signer,
  input: Omit<VerifyNftCollectionInput, 'mintAddress' | 'creator'> = {}
) {
  return this.metaplex.operations().getTask(
    verifyNftCollectionOperation({
      ...input,
      mintAddress: toMintAddress(nftOrSft),
      creator,
    })
  );
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
  collectionNft: Nft;
  collectionAuthority?: Signer; // Defaults to mx.identity().
  payer?: Signer; // Defaults to mx.identity().

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
    collectionNft,
    collectionAuthority = metaplex.identity(),
    payer = metaplex.identity(),
  } = params;

  const metadataAddress = findMetadataPda(mintAddress);
  const isSizedCollection = collectionNft.collectionDetails !== null;
  const accounts = {
    metadata: metadataAddress,
    collectionAuthority: collectionAuthority.publicKey,
    payer: payer.publicKey,
    collectionMint: collectionNft.address,
    collection: collectionNft.metadataAddress,
    collectionMasterEditionAccount: collectionNft.edition.address,

    // TODO(loris): Only add if using delegated authority.
    collectionAuthorityRecord: findCollectionAuthorityRecordPda(
      mintAddress,
      collectionAuthority.publicKey
    ),
  };

  const instruction = isSizedCollection
    ? createVerifySizedCollectionItemInstruction(accounts)
    : createVerifyCollectionInstruction(accounts);

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
