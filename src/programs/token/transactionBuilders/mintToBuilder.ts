import { PublicKey, Signer as Web3Signer } from "@solana/web3.js";
import { TransactionBuilder } from "@/programs/shared";
import { createMintToInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Signer } from "@/utils";

export interface MintToBuilderParams {
  mint: PublicKey;
  destination: PublicKey;
  mintAuthority: PublicKey | Signer;
  amount: number | bigint;
  multiSigners?: Web3Signer[];
  tokenProgram?: PublicKey;
  instructionKey?: string;
}

export const mintToBuilder = (params: MintToBuilderParams): TransactionBuilder => {
  const {
    mint,
    destination,
    mintAuthority,
    amount,
    multiSigners = [],
    tokenProgram = TOKEN_PROGRAM_ID,
    instructionKey = 'mintTo',
  } = params;

  const [mintAuthorityPublicKey, signers] = mintAuthority instanceof PublicKey
    ? [mintAuthority, multiSigners]
    : [mintAuthority.publicKey, [mintAuthority]];

  return TransactionBuilder.make().add({
    instruction: createMintToInstruction(
      mint,
      destination,
      mintAuthorityPublicKey,
      amount,
      multiSigners,
      tokenProgram,
    ),
    signers,
    key: instructionKey,
  });
}
