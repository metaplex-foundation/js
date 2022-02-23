import { Keypair, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Pda } from '@/utils';
import { createCreateMetadataAccountV2Instruction, DataV2, MetadataAccount, TransactionBuilder } from '@/programs';

export interface CreateMetadataAccountParams {
  data: DataV2,
  isMutable?: boolean,
  mint: PublicKey,
  mintAuthority: PublicKey,
  updateAuthority?: PublicKey,
  feePayer: Keypair, // TODO: Make optional and defaults to transaction fee payer.
}

export interface CreateMetadataAccountResult {
  metadata: Pda,
  transactionSignature: string,
}

export const createMetadataAccount = async (metaplex: Metaplex, params: CreateMetadataAccountParams): Promise<CreateMetadataAccountResult> => {
  const metadata = await MetadataAccount.pda(params.mint);

  const ix = createCreateMetadataAccountV2Instruction({
    metadata,
    mint: params.mint,
    mintAuthority: params.mintAuthority,
    payer: params.feePayer.publicKey,
    updateAuthority: params.updateAuthority ?? params.mintAuthority,
  }, {
    createMetadataAccountArgsV2: {
      data: params.data,
      isMutable: params.isMutable ?? false,
    }
  });

  const txBuilder = new TransactionBuilder();
  txBuilder.add({
    instruction: ix,
    signers: [params.feePayer],
    key: 'CreateMetadataAccountV2',
  });
  const transactionSignature = await txBuilder.sendTransaction(metaplex.connection);

  return { metadata, transactionSignature };
};
