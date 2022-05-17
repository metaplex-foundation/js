import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Signer } from '@/types';
import { TransactionBuilder } from '@/utils';

export interface CreateAccountBuilderParams {
  space: number;
  lamports: number;
  payer: Signer;
  newAccount: Signer;
  program?: PublicKey;
  instructionKey?: string;
}

export const createAccountBuilder = (
  params: CreateAccountBuilderParams
): TransactionBuilder => {
  const {
    space,
    lamports,
    payer,
    newAccount,
    program = SystemProgram.programId,
    instructionKey = 'createAccount',
  } = params;

  return TransactionBuilder.make().add({
    instruction: SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: newAccount.publicKey,
      space,
      lamports,
      programId: program,
    }),
    signers: [payer, newAccount],
    key: instructionKey,
  });
};
