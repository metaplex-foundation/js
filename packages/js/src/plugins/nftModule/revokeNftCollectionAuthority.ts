import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, Signer, useOperation } from '@/types';
import { TransactionBuilder } from '@/utils';
import { createRevokeCollectionAuthorityInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { HasMintAddress, toMintAddress } from './helpers';
import type { NftBuildersClient } from './NftBuildersClient';
import type { NftClient } from './NftClient';
import { findCollectionAuthorityRecordPda, findMetadataPda } from './pdas';

// -----------------
// Clients
// -----------------

/** @internal */
export function _revokeNftCollectionAuthorityClient(
  this: NftClient,
  nftOrSft: HasMintAddress,
  collectionAuthority: PublicKey,
  input: Omit<
    RevokeNftCollectionAuthorityInput,
    'mintAddress' | 'collectionAuthority'
  > = {}
) {
  return this.metaplex.operations().getTask(
    revokeNftCollectionAuthorityOperation({
      ...input,
      mintAddress: toMintAddress(nftOrSft),
      collectionAuthority,
    })
  );
}

/** @internal */
export function _revokeNftCollectionAuthorityBuildersClient(
  this: NftBuildersClient,
  input: RevokeNftCollectionAuthorityBuilderParams
) {
  return revokeNftCollectionAuthorityBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'RevokeNftCollectionAuthorityOperation' as const;
export const revokeNftCollectionAuthorityOperation =
  useOperation<RevokeNftCollectionAuthorityOperation>(Key);
export type RevokeNftCollectionAuthorityOperation = Operation<
  typeof Key,
  RevokeNftCollectionAuthorityInput,
  RevokeNftCollectionAuthorityOutput
>;

export interface RevokeNftCollectionAuthorityInput {
  // Accounts.
  mintAddress: PublicKey;
  collectionAuthority: PublicKey;
  revokeAuthority?: Signer; // Can be the update authority of the delegated collection authority. Defaults to mx.identity().

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface RevokeNftCollectionAuthorityOutput {
  response: SendAndConfirmTransactionResponse;
}

// -----------------
// Handler
// -----------------

export const revokeNftCollectionAuthorityOperationHandler: OperationHandler<RevokeNftCollectionAuthorityOperation> =
  {
    handle: async (
      operation: RevokeNftCollectionAuthorityOperation,
      metaplex: Metaplex
    ): Promise<RevokeNftCollectionAuthorityOutput> => {
      return revokeNftCollectionAuthorityBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

export type RevokeNftCollectionAuthorityBuilderParams = Omit<
  RevokeNftCollectionAuthorityInput,
  'confirmOptions'
> & {
  instructionKey?: string;
};

export const revokeNftCollectionAuthorityBuilder = (
  metaplex: Metaplex,
  params: RevokeNftCollectionAuthorityBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    collectionAuthority,
    revokeAuthority = metaplex.identity(),
  } = params;
  const metadata = findMetadataPda(mintAddress);
  const collectionAuthorityRecord = findCollectionAuthorityRecordPda(
    mintAddress,
    collectionAuthority
  );

  const instruction = createRevokeCollectionAuthorityInstruction({
    collectionAuthorityRecord,
    delegateAuthority: collectionAuthority,
    revokeAuthority: revokeAuthority.publicKey,
    metadata,
    mint: mintAddress,
  });

  // Temporary fix. The Shank macro wrongfully ask for the delegateAuthority to be a signer.
  // https://github.com/metaplex-foundation/metaplex-program-library/pull/639
  instruction.keys[1].isSigner = false;

  return (
    TransactionBuilder.make()

      // Revoke the collection authority.
      .add({
        instruction,
        signers: [revokeAuthority],
        key: params.instructionKey ?? 'revokeCollectionAuthority',
      })
  );
};
