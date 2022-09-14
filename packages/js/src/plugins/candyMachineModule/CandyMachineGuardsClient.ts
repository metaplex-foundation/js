import type { Metaplex } from '@/Metaplex';
import {
  deserialize,
  deserializeFeatureFlags,
  PublicKey,
  serialize,
} from '@/types';
import { padEmptyChars, removeEmptyChars } from '@/utils';
import beet from '@metaplex-foundation/beet';
import { Buffer } from 'buffer';
import { CANDY_GUARD_LABEL_SIZE } from './constants';
import { UnregisteredCandyGuardError } from './errors';
import {
  CandyGuardManifest,
  CandyGuardsSettings,
  DefaultCandyGuardSettings,
} from './guards';
import { CandyGuardProgram } from './programs';

/**
 * TODO
 *
 * @see {@link CandyGuardClient}
 * @group Module
 */
export class CandyMachineGuardsClient {
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
    guards: Partial<T>,
    groups: { label: string; guards: Partial<T> }[] = [],
    program: string | PublicKey | CandyGuardProgram = 'CandyGuardProgram'
  ): Buffer {
    const availableGuards = this.forProgram(program);
    const serializeSet = (set: Partial<T>): Buffer => {
      return availableGuards.reduce((acc, guard) => {
        const value = set[guard.name] ?? null;
        const optionPrefix = Buffer.from([value ? 1 : 0]);
        const newBuffer = value
          ? serialize(value, guard.settingsSerializer)
          : Buffer.from([]);
        acc = Buffer.concat([acc, optionPrefix, newBuffer]);
        return acc;
      }, Buffer.from([]));
    };

    let buffer = serializeSet(guards);

    if (groups.length > 0) {
      const groupCountBuffer = Buffer.alloc(5);
      beet.u8.write(groupCountBuffer, 0, 1);
      beet.u32.write(groupCountBuffer, 1, groups.length);
      buffer = Buffer.concat([buffer, groupCountBuffer]);
    } else {
      buffer = Buffer.concat([buffer, Buffer.from([0])]);
    }

    groups.forEach((group) => {
      const labelBuffer = Buffer.alloc(4 + CANDY_GUARD_LABEL_SIZE);
      beet
        .fixedSizeUtf8String(CANDY_GUARD_LABEL_SIZE)
        .write(
          labelBuffer,
          0,
          padEmptyChars(group.label, CANDY_GUARD_LABEL_SIZE)
        );
      buffer = Buffer.concat([buffer, labelBuffer, serializeSet(group.guards)]);
    });

    return buffer;
  }

  /** TODO */
  deserializeSettings<
    T extends CandyGuardsSettings = DefaultCandyGuardSettings
  >(
    buffer: Buffer,
    program: string | PublicKey | CandyGuardProgram = 'CandyGuardProgram'
  ): { guards: T; groups: { label: string; guards: T }[] } {
    const availableGuards = this.forProgram(program);
    const deserializeSet = () => {
      const serializedFeatures = buffer.slice(0, 8);
      const features = deserializeFeatureFlags(serializedFeatures, 64)[0];
      buffer = buffer.slice(8);

      return availableGuards.reduce((acc, guard, index) => {
        const isEnabled = features[index] ?? false;
        acc[guard.name] = null;
        if (!isEnabled) return acc;

        const [settings] = deserialize(buffer, guard.settingsSerializer);
        buffer = buffer.slice(guard.settingsBytes);
        acc[guard.name] = settings;
        return acc;
      }, {} as CandyGuardsSettings) as T;
    };

    const guards: T = deserializeSet();
    const groups: { label: string; guards: T }[] = [];
    const groupsCount = beet.u32.read(buffer, 0);
    buffer = buffer.slice(4);

    for (let i = 0; i < groupsCount; i++) {
      const label = removeEmptyChars(
        buffer.slice(0, CANDY_GUARD_LABEL_SIZE).toString('utf8')
      );
      buffer = buffer.slice(CANDY_GUARD_LABEL_SIZE);
      groups.push({ label, guards: deserializeSet() });
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
