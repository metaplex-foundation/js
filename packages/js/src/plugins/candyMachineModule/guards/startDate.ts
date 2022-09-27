import {
  createSerializerFromBeet,
  DateTime,
  mapSerializer,
  toDateTime,
} from '@/types';
import { StartDate, startDateBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/**
 * The startDate guard ...
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export type StartDateGuardSettings = {
  date: DateTime;
};

/** @internal */
export const startDateGuardManifest: CandyGuardManifest<StartDateGuardSettings> =
  {
    name: 'startDate',
    settingsBytes: 8,
    settingsSerializer: mapSerializer<StartDate, StartDateGuardSettings>(
      createSerializerFromBeet(startDateBeet),
      (settings) => ({ date: toDateTime(settings.date) }),
      (settings) => settings
    ),
  };
