import { PublicKey } from '@solana/web3.js';
import {
  createUtilizeInstruction,
  UtilizeInstructionAccounts,
} from '@metaplex-foundation/mpl-token-metadata';
import { Signer } from '@/types';
import { InstructionWithSigners } from '@/utils';

export interface CreateUtilizeInstructionWithSignersParams {
  numberOfUses: number;
  metadata: PublicKey;
  tokenAccount: PublicKey;
  mint: PublicKey;
  useAuthority: Signer;
  owner: PublicKey;
  useAuthorityRecord?: PublicKey | undefined;
  burner?: PublicKey | undefined;
  instructionKey?: string;
}

export const createUtilizeInstructionWithSigners = (
  params: CreateUtilizeInstructionWithSignersParams
): InstructionWithSigners => {
  const {
    numberOfUses,
    metadata,
    tokenAccount,
    mint,
    owner,
    useAuthority,
    useAuthorityRecord,
    burner,
    instructionKey = 'utilize',
  } = params;

  const accounts: UtilizeInstructionAccounts = {
    metadata,
    tokenAccount,
    useAuthority: useAuthority.publicKey,
    mint,
    owner,
    useAuthorityRecord,
    burner,
  };

  return {
    instruction: createUtilizeInstruction(accounts, {
      utilizeArgs: {
        numberOfUses,
      },
    }),
    signers: [useAuthority],
    key: instructionKey,
  };
};
