import { PublicKey } from '@solana/web3.js';
import { DataV2 } from '@metaplex-foundation/mpl-token-metadata';
import { TransactionBuilder, Signer } from '@/shared';
import { createCreateMetadataAccountV2Instruction } from './_temporaryCreateMetadataAccountV2Instruction';

export interface CreateMetadataV2BuilderParams {
  data: DataV2;
  isMutable?: boolean;
  mintAuthority: Signer;
  payer: Signer;
  mint: PublicKey;
  metadata: PublicKey;
  updateAuthority: PublicKey;
  instructionKey?: string;
}

export const createMetadataV2Builder = (
  params: CreateMetadataV2BuilderParams
): TransactionBuilder => {
  const {
    data,
    isMutable = false,
    mintAuthority,
    payer,
    mint,
    metadata,
    updateAuthority,
    instructionKey = 'createMetadataV2',
  } = params;

  return TransactionBuilder.make().add({
    instruction: createCreateMetadataAccountV2Instruction(
      {
        metadata,
        mint,
        mintAuthority: mintAuthority.publicKey,
        payer: payer.publicKey,
        updateAuthority,
      },
      { createMetadataAccountArgsV2: { data, isMutable } }
    ),
    signers: [payer, mintAuthority],
    key: instructionKey,
  });
};
