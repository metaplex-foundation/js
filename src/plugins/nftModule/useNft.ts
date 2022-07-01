import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { useOperation, Operation, Signer, OperationHandler } from '@/types';
import { Nft } from './Nft';
import { Metaplex } from '@/Metaplex';
import {
  createUtilizeInstructionWithSigners,
  findMetadataPda,
} from '@/programs';
import { TransactionBuilder } from '@/utils';
import { UtilizeInstructionAccounts } from '@metaplex-foundation/mpl-token-metadata';

const Key = 'UseNftOperation' as const;
export const useNftOperation = useOperation<UseNftOperation>(Key);
export type UseNftOperation = Operation<typeof Key, UseNftInput, UseNftOutput>;

export interface UseNftInput {
  nft: Nft;

  // Data.
  numberOfUses?: number;

  // Signers.
  updateAuthority?: Signer;

  // Options.
  confirmOptions?: ConfirmOptions;
}

export interface UseNftOutput {
  transactionId: string;
}

export const useNftOperationHandler: OperationHandler<UseNftOperation> = {
  handle: async (
    operation: UseNftOperation,
    metaplex: Metaplex
  ): Promise<UseNftOutput> => {
    const {
      nft,
      numberOfUses = 1,
      updateAuthority = metaplex.identity(),
      confirmOptions,
    } = operation.input;

    // something is wrong here...
    const metadata = findMetadataPda(nft.mint);

    const accounts: UtilizeInstructionAccounts = {
      mint: nft.mint,
      owner: nft.metadataAccount.owner,
      useAuthority: nft.updateAuthority,
      tokenAccount: nft.mint,
      metadata,
    };

    const transaction = useNftBuilder({
      ...accounts,
      numberOfUses,
      updateAuthority,
      metadata: nft.metadataAccount.publicKey,
    });

    const { signature } = await metaplex
      .rpc()
      .sendAndConfirmTransaction(transaction, undefined, confirmOptions);

    return { transactionId: signature };
  },
};

export interface UseNftBuilderParams {
  // Data.
  numberOfUses: number;

  // Signers.
  updateAuthority: Signer;

  // Public keys.
  metadata: PublicKey;
  tokenAccount: PublicKey;
  mint: PublicKey;
  useAuthority: PublicKey;
  owner: PublicKey;

  // Instruction keys.
  instructionKey?: string;
}

export const useNftBuilder = (
  params: UseNftBuilderParams
): TransactionBuilder => {
  const {
    numberOfUses,
    updateAuthority,
    metadata,
    instructionKey,
    tokenAccount,
    mint,
    useAuthority,
    owner,
  } = params;

  return TransactionBuilder.make().add(
    createUtilizeInstructionWithSigners({
      numberOfUses,
      metadata,
      updateAuthority,
      tokenAccount,
      mint,
      useAuthority,
      owner,
      instructionKey,
    })
  );
};
