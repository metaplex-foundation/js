import { PublicKey } from '@solana/web3.js';
import { CreateMetadataV2, DataV2 } from '@metaplex-foundation/mpl-token-metadata';
import { Metaplex } from '@/Metaplex';
import { MetadataAccount } from '@/models';
import { Pda } from '@/utils';

export interface CreateMetadataAccountParams {
  data: DataV2,
  mint: PublicKey,
  mintAuthority: PublicKey,
  updateAuthority?: PublicKey,
  feePayer: PublicKey,
}

export interface CreateMetadataAccountResult {
  metadata: Pda,
  transactionSignature: string,
}

export const createMetadataAccount = async (metaplex: Metaplex, params: CreateMetadataAccountParams): Promise<CreateMetadataAccountResult> => {
  const metadata = await MetadataAccount.pda(params.mint);

  const transaction = new CreateMetadataV2({ feePayer: params.feePayer }, {
    metadata,
    metadataData: params.data,
    mint: params.mint,
    mintAuthority: params.mintAuthority,
    updateAuthority: params.updateAuthority ?? params.mintAuthority,
  })

  const transactionSignature = await metaplex.connection.sendTransaction(transaction, [
    // TODO
  ]);

  return {
    metadata,
    transactionSignature,
  };
};
