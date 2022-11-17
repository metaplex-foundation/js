import { programGateBeet } from '@metaplex-foundation/mpl-candy-guard';
import * as beet from '@metaplex-foundation/beet';
import { MaximumOfFiveAdditionalProgramsError } from '../errors';
import { CandyGuardManifest } from './core';
import { PublicKey } from '@/types';

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

const MAXIMUM_SIZE = 5;
const SETTINGS_BYTES = 4 + MAXIMUM_SIZE * 32;

/** @internal */
export const programGateGuardManifest: CandyGuardManifest<ProgramGateGuardSettings> =
  {
    name: 'programGate',
    settingsBytes: SETTINGS_BYTES,
    settingsSerializer: {
      description: programGateBeet.description,
      serialize: (value: ProgramGateGuardSettings) => {
        // maximum of 5 additional programs allowed
        if (value.additional.length >= MAXIMUM_SIZE) {
          throw new MaximumOfFiveAdditionalProgramsError('programGate');
        }

        // create buffer with beet
        const fixedBeet = programGateBeet.toFixedFromValue(value);
        const writer = new beet.BeetWriter(fixedBeet.byteSize);
        writer.write(fixedBeet, value);

        // create 164 byte buffer and fill with previous buffer
        // this allows for < 5 additional programs
        const bufferFullSize = Buffer.alloc(SETTINGS_BYTES);
        bufferFullSize.fill(writer.buffer);

        return bufferFullSize;
      },
      deserialize: (buffer: Buffer, offset?: number) => {
        const fixedBeet = programGateBeet.toFixedFromData(buffer, offset ?? 0);
        const reader = new beet.BeetReader(buffer, offset ?? 0);
        const value = reader.read(fixedBeet);
        return [value, reader.offset];
      },
    },
  };
