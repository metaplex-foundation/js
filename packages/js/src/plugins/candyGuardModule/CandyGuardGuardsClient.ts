import type { Metaplex } from '@/Metaplex';
import { deserialize, PublicKey, serialize } from '@/types';
import { Buffer } from 'buffer';
import { UnregisteredCandyGuardError } from './errors';
import {
  CandyGuardManifest,
  CandyGuardsSettings,
  DefaultCandyGuardSettings,
} from './guards';
import { CandyGuardProgram } from './program';

/**
 * TODO
 *
 * @see {@link CandyGuardClient}
 * @group Module
 */
export class CandyGuardGuardsClient {
  private guards: CandyGuardManifest<any>[] = [];

  constructor(protected readonly metaplex: Metaplex) {}

  /** TODO */
  register(...guard: CandyGuardManifest<any>[]) {
    this.guards.push(...guard);
  }

  /** TODO */
  getGuard(name: string): CandyGuardManifest<any> {
    const guard = this.guards.find((guard) => guard.name === name);

    if (!guard) {
      throw new UnregisteredCandyGuardError(name);
    }

    return guard;
  }

  /** TODO */
  getAllGuards(): CandyGuardManifest<any>[] {
    return this.guards;
  }

  /** TODO */
  getAllGuardsForProgram(
    program: string | PublicKey | CandyGuardProgram = 'CandyGuardProgram'
  ): CandyGuardManifest<any>[] {
    const candyGuardProgram =
      typeof program === 'object' && 'availableGuards' in program
        ? program
        : this.metaplex.programs().get<CandyGuardProgram>(program);

    return candyGuardProgram.availableGuards.map((name) => this.getGuard(name));
  }

  /** TODO */
  serializeSettings<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    settings: T,
    program: string | PublicKey | CandyGuardProgram = 'CandyGuardProgram'
  ): Buffer {
    return this.getAllGuardsForProgram(program).reduce((acc, guard): Buffer => {
      const value = settings[guard.name] ?? null;
      const buffer = serialize(value, guard.settingsSerializer);
      return Buffer.concat([acc, buffer]);
    }, Buffer.from([]));
  }

  /** TODO */
  deserializeSettings<
    T extends CandyGuardsSettings = DefaultCandyGuardSettings
  >(
    buffer: Buffer,
    program: string | PublicKey | CandyGuardProgram = 'CandyGuardProgram'
  ): T {
    return this.getAllGuardsForProgram(program).reduce((acc, guard) => {
      const [settings, offset] = deserialize(buffer, guard.settingsSerializer);
      buffer = buffer.slice(offset);
      acc[guard.name] = settings;
      return acc;
    }, {} as CandyGuardsSettings) as T;
  }

  /** TODO */
  serializeMintArguments() {
    // TODO
  }

  /** TODO */
  serializeMintRemainingAccounts() {
    // TODO
  }
}
