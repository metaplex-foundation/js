import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import BN from 'bn.js';
import { Pda } from '@/types';
import { TokenMetadataProgram } from '../TokenMetadataProgram';

export const findEditionMarkerPda = (
  mint: PublicKey,
  edition: BN,
  programId: PublicKey = TokenMetadataProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('metadata', 'utf8'),
    programId.toBuffer(),
    mint.toBuffer(),
    Buffer.from('edition', 'utf8'),
    Buffer.from(edition.div(new BN(248)).toString()),
  ]);
};
