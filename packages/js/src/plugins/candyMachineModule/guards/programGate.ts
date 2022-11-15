import {
  ProgramGate,
  programGateBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import type { FixableBeet } from '@metaplex-foundation/beet';
import { CandyGuardManifest } from './core';
import {
  createSerializerFromBeet,
  mapSerializer,
  PublicKey,
  toPublicKey,
} from '@/types';

/**
 * The ProgramGate guard restricts the programs that can be in a mint transaction.
 * The guard allows the necessary programs for the mint and any other program specified in the configuration.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export type ProgramGateGuardSettings = {
  /** Array of additional programs that can be in a mint transaction. */
  additional: PublicKey[];
};

/** @internal */
export const programGateGuardManifest: CandyGuardManifest<ProgramGateGuardSettings> =
  {
    name: 'programGate',
    settingsBytes: 164, // 4 + MAXIMUM_SIZE (5) * 32
    settingsSerializer: mapSerializer<ProgramGate, ProgramGateGuardSettings>(
      createSerializerFromBeet(programGateBeet as FixableBeet<ProgramGate>),
      (settings) => ({
        additional: settings.additional.map((addition) =>
          toPublicKey(addition)
        ),
      }),
      (settings) => settings
    ),
  };
