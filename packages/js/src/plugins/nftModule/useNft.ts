import { Metaplex } from '@/Metaplex';
import {
  isSigner,
  Operation,
  OperationHandler,
  Signer,
  toPublicKey,
  useOperation,
} from '@/types';
import { TransactionBuilder } from '@/utils';
import { createUtilizeInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { findAssociatedTokenAccountPda } from '../tokenModule';
import { OwnerMustBeProvidedAsASignerError } from './errors';
import { HasMintAddress, toMintAddress } from './helpers';
import type { NftBuildersClient } from './NftBuildersClient';
import type { NftClient } from './NftClient';
import {
  findMetadataPda,
  findProgramAsBurnerPda,
  findUseAuthorityRecordPda,
} from './pdas';

// -----------------
// Clients
// -----------------

/** @internal */
export function _useNftClient(
  this: NftClient,
  nft: HasMintAddress,
  input: Omit<UseNftInput, 'mintAddress'> = {}
) {
  return this.metaplex
    .operations()
    .getTask(useNftOperation({ ...input, mintAddress: toMintAddress(nft) }));
}

/** @internal */
export function _useNftBuildersClient(
  this: NftBuildersClient,
  input: UseNftBuilderParams
) {
  return useNftBuilder(this.metaplex, input);
}

// -----------------
// Operation
// -----------------

const Key = 'UseNftOperation' as const;
export const useNftOperation = useOperation<UseNftOperation>(Key);
export type UseNftOperation = Operation<typeof Key, UseNftInput, UseNftOutput>;

export interface UseNftInput {
  // Accounts and models.
  mintAddress: PublicKey;
  numberOfUses?: number; // Defaults to 1.
  owner?: PublicKey | Signer; // Defaults to mx.identity().
  ownerTokenAccount?: PublicKey; // Defaults to associated token account.
  useAuthority?: Signer; // Defaults to not being used.

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface UseNftOutput {
  response: SendAndConfirmTransactionResponse;
}

// -----------------
// Handler
// -----------------

export const useNftOperationHandler: OperationHandler<UseNftOperation> = {
  handle: async (
    operation: UseNftOperation,
    metaplex: Metaplex
  ): Promise<UseNftOutput> => {
    return useNftBuilder(metaplex, operation.input).sendAndConfirm(
      metaplex,
      operation.input.confirmOptions
    );
  },
};

// -----------------
// Builder
// -----------------

export type UseNftBuilderParams = Omit<UseNftInput, 'confirmOptions'> & {
  utilizeInstructionKey?: string;
};

export const useNftBuilder = (
  metaplex: Metaplex,
  params: UseNftBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    numberOfUses = 1,
    owner = metaplex.identity(),
    useAuthority,
  } = params;

  if (!isSigner(owner) && !useAuthority) {
    throw new OwnerMustBeProvidedAsASignerError();
  }

  const metadata = findMetadataPda(mintAddress);
  const tokenAccount =
    params.ownerTokenAccount ??
    findAssociatedTokenAccountPda(mintAddress, toPublicKey(owner));
  const useAuthorityRecord = useAuthority
    ? findUseAuthorityRecordPda(mintAddress, useAuthority.publicKey)
    : undefined;
  const programAsBurner = findProgramAsBurnerPda();

  return (
    TransactionBuilder.make()

      // Update the metadata account.
      .add({
        instruction: createUtilizeInstruction(
          {
            metadata,
            tokenAccount,
            useAuthority: useAuthority
              ? useAuthority.publicKey
              : toPublicKey(owner),
            mint: mintAddress,
            owner: toPublicKey(owner),
            useAuthorityRecord,
            burner: useAuthorityRecord ? programAsBurner : undefined,
          },
          { utilizeArgs: { numberOfUses } }
        ),
        signers: [owner, useAuthority].filter(isSigner),
        key: params.utilizeInstructionKey ?? 'utilize',
      })
  );
};
