import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { useOperation, Operation, Signer, OperationHandler } from '@/types';
import { Nft } from './Nft';
import { Metaplex } from '@/Metaplex';
import {
  createUtilizeInstructionWithSigners,
  findAssociatedTokenAccountPda,
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
  useAuthority?: Signer;

  // Public Keys.
  owner?: PublicKey;

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
      useAuthority = metaplex.identity(),
      confirmOptions,
      owner = useAuthority.publicKey,
    } = operation.input;

    const metadata = findMetadataPda(nft.mint);
    const tokenAccount = findAssociatedTokenAccountPda(nft.mint, owner);

    const accounts: UtilizeInstructionAccounts = {
      mint: nft.mint,
      useAuthority: useAuthority.publicKey,
      owner,
      tokenAccount,
      metadata,
    };

    const transaction = useNftBuilder({
      ...accounts,
      numberOfUses,
      useAuthority,
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
  useAuthority: Signer;

  // Public keys.
  metadata: PublicKey;
  tokenAccount: PublicKey;
  mint: PublicKey;
  owner: PublicKey;

  // Instruction keys.
  instructionKey?: string;
}

export const useNftBuilder = (
  params: UseNftBuilderParams
): TransactionBuilder => {
  const {
    numberOfUses,
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
      tokenAccount,
      mint,
      useAuthority,
      owner,
      instructionKey,
    })
  );
};
