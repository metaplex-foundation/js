import { Buffer } from 'buffer';
import type { Metaplex } from '@/Metaplex';
import { Pda, Program, PublicKey } from '@/types';

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

  /**
   * Finds the Mint Limit Counter PDA that keeps track of how many
   * NFTs where minted by a given user on a given Candy Machine.
   */
  mintLimitCounter({
    id,
    user,
    candyMachine,
    candyGuard,
    programs,
  }: {
    /** A unique identifier in the context of a Candy Machine/Candy Guard combo. */
    id: number;
    /** The address of the wallet trying to mint. */
    user: PublicKey;
    /** The address of the Candy Guard account. */
    candyGuard: PublicKey;
    /** The address of the Candy Machine account. */
    candyMachine: PublicKey;
    /** An optional set of programs that override the registered ones. */
    programs?: Program[];
  }): Pda {
    const program = this.metaplex.programs().getCandyGuard(programs);
    return Pda.find(program.address, [
      Buffer.from([id]),
      user.toBuffer(),
      candyGuard.toBuffer(),
      candyMachine.toBuffer(),
    ]);
  }
}
