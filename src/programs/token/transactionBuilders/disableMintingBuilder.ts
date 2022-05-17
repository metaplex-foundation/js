import { PublicKey } from '@solana/web3.js';
import { AuthorityType } from '@solana/spl-token';
import { Signer, KeypairSigner } from '@/types';
import { TransactionBuilder } from '@/utils';
import { setAuthorityBuilder } from './setAuthorityBuilder';

export interface DisableMintingBuilderParams {
  mint: PublicKey;
  mintAuthority: PublicKey | Signer;
  multiSigners?: KeypairSigner[];
  tokenProgram?: PublicKey;
  instructionKey?: string;
}

export const disableMintingBuilder = (
  params: DisableMintingBuilderParams
): TransactionBuilder => {
  const {
    mint,
    mintAuthority,
    multiSigners,
    tokenProgram,
    instructionKey = 'disableMinting',
  } = params;

  return TransactionBuilder.make().add(
    setAuthorityBuilder({
      mint,
      currentAuthority: mintAuthority,
      authorityType: AuthorityType.MintTokens,
      newAuthority: null,
      multiSigners,
      tokenProgram,
      instructionKey,
    })
  );
};
