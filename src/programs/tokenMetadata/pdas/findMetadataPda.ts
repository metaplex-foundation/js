import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Pda } from '@/types';
import { TokenMetadataProgram } from '../TokenMetadataProgram';

export const findMetadataPda = (
  mint: PublicKey,
  programId: PublicKey = TokenMetadataProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('metadata', 'utf8'),
    programId.toBuffer(),
    mint.toBuffer(),
  ]);
};
