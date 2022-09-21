import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { BigNumber, Pda, toBigNumber } from '@/types';
import { PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';

/** @group Pdas */
export const findMetadataPda = (
  mint: PublicKey,
  programId: PublicKey = PROGRAM_ID
): Pda => {
  return Pda.find(programId, [
    Buffer.from('metadata', 'utf8'),
    programId.toBuffer(),
    mint.toBuffer(),
  ]);
};

/** @group Pdas */
export const findMasterEditionV2Pda = (
  mint: PublicKey,
  programId: PublicKey = PROGRAM_ID
): Pda => {
  return Pda.find(programId, [
    Buffer.from('metadata', 'utf8'),
    programId.toBuffer(),
    mint.toBuffer(),
    Buffer.from('edition', 'utf8'),
  ]);
};

/** @group Pdas */
export const findEditionPda = (
  mint: PublicKey,
  programId: PublicKey = PROGRAM_ID
): Pda => {
  return Pda.find(programId, [
    Buffer.from('metadata', 'utf8'),
    programId.toBuffer(),
    mint.toBuffer(),
    Buffer.from('edition', 'utf8'),
  ]);
};

/** @group Pdas */
export const findEditionMarkerPda = (
  mint: PublicKey,
  edition: BigNumber,
  programId: PublicKey = PROGRAM_ID
): Pda => {
  return Pda.find(programId, [
    Buffer.from('metadata', 'utf8'),
    programId.toBuffer(),
    mint.toBuffer(),
    Buffer.from('edition', 'utf8'),
    Buffer.from(edition.div(toBigNumber(248)).toString()),
  ]);
};

/** @group Pdas */
export const findCollectionAuthorityRecordPda = (
  mint: PublicKey,
  collectionAuthority: PublicKey,
  programId: PublicKey = PROGRAM_ID
): Pda => {
  return Pda.find(programId, [
    Buffer.from('metadata', 'utf8'),
    programId.toBuffer(),
    mint.toBuffer(),
    Buffer.from('collection_authority', 'utf8'),
    collectionAuthority.toBuffer(),
  ]);
};

/** @group Pdas */
export const findUseAuthorityRecordPda = (
  mint: PublicKey,
  useAuthority: PublicKey,
  programId: PublicKey = PROGRAM_ID
): Pda => {
  return Pda.find(programId, [
    Buffer.from('metadata', 'utf8'),
    programId.toBuffer(),
    mint.toBuffer(),
    Buffer.from('user', 'utf8'),
    useAuthority.toBuffer(),
  ]);
};

/** @group Pdas */
export const findProgramAsBurnerPda = (
  programId: PublicKey = PROGRAM_ID
): Pda => {
  return Pda.find(programId, [
    Buffer.from('metadata', 'utf8'),
    programId.toBuffer(),
    Buffer.from('burn', 'utf8'),
  ]);
};
