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
  readonly guards: CandyGuardManifest<any>[] = [];

  constructor(protected readonly metaplex: Metaplex) {}

  /** TODO */
  register(...guard: CandyGuardManifest<any>[]) {
    this.guards.push(...guard);
  }

  /** TODO */
  get(name: string): CandyGuardManifest<any> {
    const guard = this.guards.find((guard) => guard.name === name);

    if (!guard) {
      throw new UnregisteredCandyGuardError(name);
    }

    return guard;
  }

  /** TODO */
  all(): CandyGuardManifest<any>[] {
    return this.guards;
  }

  /** TODO */
  forProgram(
    program: string | PublicKey | CandyGuardProgram = 'CandyGuardProgram'
  ): CandyGuardManifest<any>[] {
    const candyGuardProgram =
      typeof program === 'object' && 'availableGuards' in program
        ? program
        : this.metaplex.programs().get<CandyGuardProgram>(program);

    return candyGuardProgram.availableGuards.map((name) => this.get(name));
  }

  /** TODO */
  serializeSettings<T extends CandyGuardsSettings = DefaultCandyGuardSettings>(
    guards: T,
    groups: T[] = [],
    program: string | PublicKey | CandyGuardProgram = 'CandyGuardProgram'
  ): Buffer {
    const availableGuards = this.forProgram(program);
    const serializeSet = (set: T) =>
      availableGuards.reduce((acc, guard): Buffer => {
        const value = set[guard.name] ?? null;
        const buffer = serialize(value, guard.settingsSerializer);
        return Buffer.concat([acc, buffer]);
      }, Buffer.from([]));

    let buffer = serializeSet(guards);
    groups.forEach((group) => {
      buffer = Buffer.concat([buffer, serializeSet(group)]);
    });

    return buffer;
  }

  /** TODO */
  deserializeSettings<
    T extends CandyGuardsSettings = DefaultCandyGuardSettings
  >(
    buffer: Buffer,
    program: string | PublicKey | CandyGuardProgram = 'CandyGuardProgram'
  ): { guards: T; groups: T[] } {
    const availableGuards = this.forProgram(program);
    const deserializeSet = () =>
      availableGuards.reduce((acc, guard) => {
        const [settings, offset] = deserialize(
          buffer,
          guard.settingsSerializer
        );
        buffer = buffer.slice(offset);
        acc[guard.name] = settings;
        return acc;
      }, {} as CandyGuardsSettings) as T;

    const guards: T = deserializeSet();
    const groups: T[] = [];

    while (buffer.length > 0) {
      groups.push(deserializeSet());
    }

    return { guards, groups };
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
