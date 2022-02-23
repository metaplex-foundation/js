import { PublicKey, Signer } from "@solana/web3.js";
import { bignum } from "@metaplex-foundation/beet";
import { TransactionBuilder } from "@/programs/shared";
import { createCreateMasterEditionV3Instruction } from "@/programs/tokenMetadata/generated";

export interface CreateMasterEditionV3BuilderParams {
  maxSupply?: bignum;
  payer: Signer;
  mintAuthority: Signer;
  updateAuthority: Signer;
  mint: PublicKey;
  metadata: PublicKey;
  masterEdition: PublicKey;
  instructionKey?: string;
}

export const createMasterEditionV3Builder = (params: CreateMasterEditionV3BuilderParams): TransactionBuilder => {
  const {
    maxSupply = null,
    payer,
    mintAuthority,
    updateAuthority,
    mint,
    metadata,
    masterEdition,
    instructionKey = 'createMasterEditionV3',
  } = params;

  return TransactionBuilder.make().add({
    instruction: createCreateMasterEditionV3Instruction(
      {
        edition: masterEdition,
        mint,
        updateAuthority: updateAuthority.publicKey,
        mintAuthority: mintAuthority.publicKey,
        payer: payer.publicKey,
        metadata,
      },
      { createMasterEditionArgs: { maxSupply } },
    ),
    signers: [payer, mintAuthority, updateAuthority],
    key: instructionKey,
  });
}
