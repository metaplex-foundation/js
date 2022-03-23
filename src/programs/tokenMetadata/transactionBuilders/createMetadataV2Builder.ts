import { PublicKey } from "@solana/web3.js";
import { TransactionBuilder } from "@/programs/shared";
import {
  createCreateMetadataAccountV2Instruction,
  DataV2,
} from "@/programs/tokenMetadata/generated";
import { Signer } from "@/utils";

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
    instructionKey = "createMetadataV2",
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
