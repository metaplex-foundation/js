import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { BigNumber, Pda, toBigNumber } from '@/types';
import { TokenMetadataProgram } from '../TokenMetadataProgram';

export const findEditionMarkerPda = (
  mint: PublicKey,
  edition: BigNumber,
  programId: PublicKey = TokenMetadataProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('metadata', 'utf8'),
    programId.toBuffer(),
    mint.toBuffer(),
    Buffer.from('edition', 'utf8'),
    Buffer.from(edition.div(toBigNumber(248)).toString()),
  ]);
};
