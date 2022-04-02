import { PublicKey, SystemProgram } from '@solana/web3.js';
import { TransactionBuilder, Signer } from '@/shared';

export interface transferBuilderParams {
  from: Signer;
  to: PublicKey;
  lamports: number;
  basePubkey?: PublicKey;
  seed?: string;
  program?: PublicKey;
  instructionKey?: string;
}

export const transferBuilder = (params: transferBuilderParams): TransactionBuilder => {
  const {
    from,
    to,
    lamports,
    basePubkey,
    seed,
    program = SystemProgram.programId,
    instructionKey = 'transfer',
  } = params;

  return TransactionBuilder.make().add({
    instruction: SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports,
      ...(seed ? { seed, basePubkey } : {}),
      programId: program,
    }),
    signers: [from],
    key: instructionKey,
  });
};
