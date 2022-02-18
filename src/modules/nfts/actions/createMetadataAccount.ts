import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { MetadataAccount, MetadataDataV2Type } from '@/modules/nfts';
import { Pda } from '@/utils';

export interface CreateMetadataAccountParams {
  data: MetadataDataV2Type,
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
  return { metadata, transactionSignature: 'todo' };
};
