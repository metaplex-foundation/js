import { Buffer } from 'buffer';
import type { Metaplex } from '@/Metaplex';
import { Pda, Program, PublicKey } from '@/types';

/**
 * This client allows you to build PDAs related to the Fusion module.
 *
 * @see {@link FusionClient}
 * @group Module Pdas
 */
export class FusionPdasClient {
  constructor(protected readonly metaplex: Metaplex) {}

  /** Finds the Fusion PDA for a mint and creator tuple. */
  fusion(input: {
    /** The mint address of the Fusion parent. */
    mint: PublicKey;
    /** The address of the Fusion's creator. */
    creator: PublicKey;
    /** An optional set of programs that override the registered ones. */
    programs?: Program[];
  }): Pda {
    const programId = this.programId(input.programs);
    return Pda.find(programId, [
      Buffer.from('trifle', 'utf8'),
      input.mint.toBuffer(),
      input.creator.toBuffer(),
    ]);
  }

  /** Finds the Fusion COE PDA for a mint and creator tuple. */
  escrow(input: {
    /** The mint address of the Fusion parent. */
    mint: PublicKey;
    /** The address of the Fusion's creator. */
    creator: PublicKey;
    /** An optional set of programs that override the registered ones. */
    programs?: Program[];
  }): Pda {
    const programId = this.tmProgramId(input.programs);
    return Pda.find(programId, [
      Buffer.from('metadata', 'utf8'),
      programId.toBuffer(),
      input.mint.toBuffer(),
      Uint8Array.from([1]),
      input.creator.toBuffer(),
      Buffer.from('escrow', 'utf8'),
    ]);
  }

  private programId(programs?: Program[]) {
    return this.metaplex.programs().getFusion(programs).address;
  }

  private tmProgramId(programs?: Program[]) {
    return this.metaplex.programs().getTokenMetadata(programs).address;
  }
}
