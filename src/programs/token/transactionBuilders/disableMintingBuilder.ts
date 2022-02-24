import { PublicKey, Signer } from "@solana/web3.js";
import { TransactionBuilder } from "@/programs/shared";
import { setAuthorityBuilder } from "@/programs/token";
import { AuthorityType } from "@solana/spl-token";

export interface DisableMintingBuilderParams {
  mint: PublicKey,
  mintAuthority: PublicKey | Signer,
  multiSigners?: Signer[],
  tokenProgram?: PublicKey;
  instructionKey?: string;
}

export const disableMintingBuilder = (params: DisableMintingBuilderParams): TransactionBuilder => {
  const {
    mint,
    mintAuthority,
    multiSigners,
    tokenProgram,
    instructionKey = 'disableMinting',
  } = params;

  return TransactionBuilder.make().add(setAuthorityBuilder({
    mint,
    currentAuthority: mintAuthority,
    authorityType: AuthorityType.MintTokens,
    newAuthority: null,
    multiSigners,
    tokenProgram,
    instructionKey,
  }));
}
