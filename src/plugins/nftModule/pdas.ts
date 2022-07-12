import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { BigNumber, Pda, toBigNumber } from '@/types';
import { TokenMetadataProgram } from './program';

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

export const findMasterEditionV2Pda = (
  mint: PublicKey,
  programId: PublicKey = TokenMetadataProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('metadata', 'utf8'),
    programId.toBuffer(),
    mint.toBuffer(),
    Buffer.from('edition', 'utf8'),
  ]);
};

export const findEditionPda = (
  mint: PublicKey,
  programId: PublicKey = TokenMetadataProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('metadata', 'utf8'),
    programId.toBuffer(),
    mint.toBuffer(),
    Buffer.from('edition', 'utf8'),
  ]);
};

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

export const findCollectionAuthorityRecordPda = (
  mint: PublicKey,
  collectionAuthority: PublicKey,
  programId: PublicKey = TokenMetadataProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('metadata', 'utf8'),
    programId.toBuffer(),
    mint.toBuffer(),
    Buffer.from('collection_authority', 'utf8'),
    collectionAuthority.toBuffer(),
  ]);
};

export const findUseAuthorityRecordPda = (
  mint: PublicKey,
  useAuthority: PublicKey,
  programId: PublicKey = TokenMetadataProgram.publicKey
): Pda => {
  return Pda.find(programId, [
    Buffer.from('metadata', 'utf8'),
    programId.toBuffer(),
    mint.toBuffer(),
    Buffer.from('user', 'utf8'),
    useAuthority.toBuffer(),
  ]);
};
