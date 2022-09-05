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
    const serializeSet = (set: T): Buffer => {
      return availableGuards.reduce((acc, guard) => {
        const value = set[guard.name] ?? null;
        const newBuffer = value
          ? serialize(value, guard.settingsSerializer)
          : Buffer.from([0]);
        acc = Buffer.concat([acc, newBuffer]);
        return acc;
      }, Buffer.from([]));
    };

    let buffer = serializeSet(guards);
    groups.forEach((group) => {
      buffer = Buffer.concat([buffer, serializeSet(group)]);
    });

    if (groups.length === 0) {
      buffer = Buffer.concat([buffer, Buffer.from([0])]);
    }

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
    const deserializeSet = () => {
      const serializedFeatures = buffer.slice(0, 8);
      const features: boolean[] = deserializeFeatures(serializedFeatures);
      buffer = buffer.slice(8);

      return availableGuards.reduce((acc, guard, index) => {
        const isEnabled = features[index] ?? false;
        acc[guard.name] = null;
        if (!isEnabled) return acc;

        const [settings, offset] = deserialize(
          buffer,
          guard.settingsSerializer
        );
        buffer = buffer.slice(offset);
        acc[guard.name] = settings;
        return acc;
      }, {} as CandyGuardsSettings) as T;
    };

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

/** @ts-ignore */
const serializeFeatures = (features: boolean[], length: number = 8): Buffer => {
  const bytes: number[] = [];
  let currentByte = 0;
  for (let i = 0; i < features.length; i++) {
    const byteIndex = i % 8;
    currentByte |= Number(features[i]) << byteIndex;
    if (byteIndex === 7) {
      bytes.push(currentByte);
      currentByte = 0;
    }
  }
  return Buffer.concat([Buffer.from(bytes)], length);
};

const deserializeFeatures = (buffer: Buffer): boolean[] => {
  const booleans: boolean[] = [];
  for (let byte of buffer) {
    for (let i = 0; i < 8; i++) {
      booleans.push(Boolean(byte & 1));
      byte >>= 1;
    }
  }
  return booleans;
};
