import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { createUtilizeInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { useOperation, Operation, Signer, OperationHandler } from '@/types';
import { isLazyNft, isNft, LazyNft, Nft } from './Nft';
import { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { findMetadataPda, findUseAuthorityRecordPda } from './pdas';
import { findAssociatedTokenAccountPda } from '../tokenModule';

// -----------------
// Operation
// -----------------

const Key = 'UseNftOperation' as const;
export const useNftOperation = useOperation<UseNftOperation>(Key);
export type UseNftOperation = Operation<typeof Key, UseNftInput, UseNftOutput>;

export interface UseNftInput {
  // Accounts and models.
  nft: Nft | LazyNft | PublicKey;
  numberOfUses?: number; // Defaults to 1.
  useAuthority?: Signer; // Defaults to mx.identity().
  owner?: PublicKey; // Defaults to mx.identity().publicKey.
  tokenAccount?: PublicKey; // Defaults to associated token account.
  isDelegated?: boolean; // Defaults to false.
  burner?: PublicKey; // Defaults to not being used.

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface UseNftOutput {
  response: SendAndConfirmTransactionResponse;
  mintAddress: PublicKey;
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

export type UseNftBuilderContext = Omit<UseNftOutput, 'response'>;

export const useNftBuilder = (
  metaplex: Metaplex,
  params: UseNftBuilderParams
): TransactionBuilder<UseNftBuilderContext> => {
  const {
    numberOfUses = 1,
    useAuthority = metaplex.identity(),
    owner = metaplex.identity().publicKey,
    isDelegated = false,
    burner,
  } = params;

  const mintAddress =
    isNft(params.nft) || isLazyNft(params.nft)
      ? params.nft.mintAddress
      : params.nft;
  const metadata = findMetadataPda(mintAddress);
  const tokenAccount = findAssociatedTokenAccountPda(mintAddress, owner);
  const useAuthorityRecord = isDelegated
    ? findUseAuthorityRecordPda(mintAddress, useAuthority.publicKey)
    : undefined;

  return (
    TransactionBuilder.make<UseNftBuilderContext>()
      .setContext({ mintAddress })

      // Update the metadata account.
      .add({
        instruction: createUtilizeInstruction(
          {
            metadata,
            tokenAccount,
            useAuthority: useAuthority.publicKey,
            mint: mintAddress,
            owner,
            useAuthorityRecord,
            burner,
          },
          { utilizeArgs: { numberOfUses } }
        ),
        signers: [useAuthority],
        key: params.utilizeInstructionKey ?? 'utilize',
      })
  );
};
