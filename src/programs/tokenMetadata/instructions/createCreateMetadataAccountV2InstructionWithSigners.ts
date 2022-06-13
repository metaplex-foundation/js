import { PublicKey } from '@solana/web3.js';
import {
  DataV2,
  createCreateMetadataAccountV2Instruction,
} from '@metaplex-foundation/mpl-token-metadata';
import { Signer } from '@/types';
import { InstructionWithSigners } from '@/utils';

export interface CreateCreateMetadataAccountV2InstructionWithSignersParams {
  data: DataV2;
  isMutable?: boolean;
  mintAuthority: Signer;
  payer: Signer;
  mint: PublicKey;
  metadata: PublicKey;
  updateAuthority: PublicKey;
  instructionKey?: string;
}

export const createCreateMetadataAccountV2InstructionWithSigners = (
  params: CreateCreateMetadataAccountV2InstructionWithSignersParams
): InstructionWithSigners => {
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

  return {
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
  };
};
