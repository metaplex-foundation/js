import { PublicKey } from '@solana/web3.js';
import {
  createSetAuthorityInstruction,
  TOKEN_PROGRAM_ID,
  AuthorityType,
} from '@solana/spl-token';
import { Signer, KeypairSigner } from '@/types';
import { TransactionBuilder } from '@/utils';

export interface SetAuthorityBuilderParams {
  mint: PublicKey;
  currentAuthority: PublicKey | Signer;
  authorityType: AuthorityType;
  newAuthority: PublicKey | null;
  multiSigners?: KeypairSigner[];
  tokenProgram?: PublicKey;
  instructionKey?: string;
}

export const setAuthorityBuilder = (
  params: SetAuthorityBuilderParams
): TransactionBuilder => {
  const {
    mint,
    currentAuthority,
    authorityType,
    newAuthority,
    multiSigners = [],
    tokenProgram = TOKEN_PROGRAM_ID,
    instructionKey = 'setAuthority',
  } = params;

  const [currentAuthorityPublicKey, signers] =
    currentAuthority instanceof PublicKey
      ? [currentAuthority, multiSigners]
      : [currentAuthority.publicKey, [currentAuthority]];

  return TransactionBuilder.make().add({
    instruction: createSetAuthorityInstruction(
      mint,
      currentAuthorityPublicKey,
      authorityType,
      newAuthority,
      multiSigners,
      tokenProgram
    ),
    signers,
    key: instructionKey,
  });
};
