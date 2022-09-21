import type { Metaplex } from '@/Metaplex';
import { Pda, Program, PublicKey } from '@/types';
import { Buffer } from 'buffer';

/**
 * This client allows you to build PDAs related to the Candy Machine module.
 *
 * @see {@link CandyMachineClient}
 * @group Module Pdas
 */
export class CandyMachinePdasClient {
  constructor(protected readonly metaplex: Metaplex) {}

  /** Finds the Authority PDA for the given Candy Machine. */
  authority({
    candyMachine,
    programs,
  }: {
    /** The Candy Machine address */
    candyMachine: PublicKey;
    /** An optional set of programs that override the registered ones. */
    programs?: Program[];
  }): Pda {
    const program = this.metaplex.programs().getCandyMachine(programs);
    return Pda.find(program.address, [
      Buffer.from('candy_machine', 'utf8'),
      candyMachine.toBuffer(),
    ]);
  }

  /** Finds the Candy Guard PDA for the given base address it derives from. */
  candyGuard({
    base,
    programs,
  }: {
    /** The base address which the Candy Guard PDA derives from. */
    base: PublicKey;
    /** An optional set of programs that override the registered ones. */
    programs?: Program[];
  }): Pda {
    const program = this.metaplex.programs().getCandyGuard(programs);
    return Pda.find(program.address, [
      Buffer.from('candy_guard', 'utf8'),
      base.toBuffer(),
    ]);
  }
}
