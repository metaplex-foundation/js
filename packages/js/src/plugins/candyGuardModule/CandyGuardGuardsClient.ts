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
      const accumulator = availableGuards.reduce(
        (acc, guard) => {
          const value = set[guard.name] ?? null;
          acc.features.push(!!value);
          if (!value) return acc;

          const newBuffer = serialize(value, guard.settingsSerializer);
          const paddedBuffer = Buffer.concat([newBuffer], guard.settingsBytes);
          acc.buffer = Buffer.concat([acc.buffer, paddedBuffer]);
          return acc;
        },
        { buffer: Buffer.from([]), features: [] as boolean[] }
      );

      const serializedFeatures = serializeFeatures(accumulator.features);
      return Buffer.concat([serializedFeatures, accumulator.buffer]);
    };

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

const serializeFeatures = (features: boolean[]): Buffer => {
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
  return Buffer.from(bytes);
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
