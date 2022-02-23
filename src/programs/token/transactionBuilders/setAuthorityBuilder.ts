import { PublicKey, Signer } from "@solana/web3.js";
import { TransactionBuilder } from "@/programs/shared";
import { createSetAuthorityInstruction, TOKEN_PROGRAM_ID, AuthorityType } from "@solana/spl-token";

export interface SetAuthorityBuilderParams {
  mint: PublicKey,
  currentAuthority: PublicKey | Signer,
  authorityType: AuthorityType,
  newAuthority: PublicKey | null,
  multiSigners?: Signer[],
  tokenProgram?: PublicKey;
  instructionKey?: string;
}

export const setAuthorityBuilder = (params: SetAuthorityBuilderParams): TransactionBuilder => {
  const {
    mint,
    currentAuthority,
    authorityType,
    newAuthority,
    multiSigners = [],
    tokenProgram = TOKEN_PROGRAM_ID,
    instructionKey = 'setAuthority',
  } = params;

  const [currentAuthorityPublicKey, signers] = currentAuthority instanceof PublicKey
    ? [currentAuthority, multiSigners]
    : [currentAuthority.publicKey, [currentAuthority]];

  return TransactionBuilder.make().add({
    instruction: createSetAuthorityInstruction(
      mint,
      currentAuthorityPublicKey,
      authorityType,
      newAuthority,
      multiSigners,
      tokenProgram,
    ),
    signers,
    key: instructionKey,
  });
}
