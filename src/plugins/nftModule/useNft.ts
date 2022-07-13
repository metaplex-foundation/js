import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import {
  useOperation,
  Operation,
  Signer,
  OperationHandler,
} from '@/types';
import { LazyNft, Nft } from './Nft';
import { Metaplex } from '@/Metaplex';
import { TransactionBuilder } from '@/utils';
import { NoInstructionsToSendError } from '@/errors';
import { SendAndConfirmTransactionResponse } from '../rpcModule';
import { findAssociatedTokenAccountPda } from '../tokenModule';
import { createUtilizeInstruction, UtilizeInstructionAccounts } from '@metaplex-foundation/mpl-token-metadata';

// -----------------
// Operation
// -----------------

const Key = 'UseNftOperation' as const;
export const useNftOperation = useOperation<UseNftOperation>(Key);
export type UseNftOperation = Operation<
  typeof Key,
  UseNftInput,
  UseNftOutput
>;


export interface UseNftInput {
    // Accounts and models.
  nft: Nft | LazyNft;
  useAuthority?: Signer;
  owner?: PublicKey;

  // Data.
  numberOfUses?: number;

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

    const {
      nft,
      useAuthority = metaplex.identity(),
      owner = useAuthority.publicKey,
      numberOfUses = 1,
      confirmOptions
    } = operation.input;

    const metadata = nft.metadataAddress;
    const tokenAccount = findAssociatedTokenAccountPda(nft.mintAddress, owner);

    const accounts: UtilizeInstructionAccounts = {
      metadata,
      tokenAccount,
      mint: nft.mintAddress,
      useAuthority: useAuthority.publicKey,
      owner
    };

    const builder = useNftBuilder({
      ...accounts,
      nft,
      numberOfUses,
      useAuthority,
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

export type UseNftBuilderParams = Omit<UseNftInput, 'confirmOptions'> & {
  useMetadataInstructionKey?: string;

  useAuthority: Signer;

  metadata: PublicKey;
  tokenAccount: PublicKey;
  mint: PublicKey;
  owner: PublicKey;

  instructionKey?: string;

  numberOfUses: number;
};

export const useNftBuilder = (
  params: UseNftBuilderParams
): TransactionBuilder => {

  return (
    TransactionBuilder.make().add({
      instruction: createUtilizeInstruction(
        {
          metadata: params.metadata,
          tokenAccount: params.tokenAccount,
          mint: params.mint,
          useAuthority: params.useAuthority.publicKey,
          owner: params.owner
        },
        {
          utilizeArgs: {
            numberOfUses: params.numberOfUses
          },
        }
      ),
      signers: [params.useAuthority],
      key: params.instructionKey,
    })
  );

};
