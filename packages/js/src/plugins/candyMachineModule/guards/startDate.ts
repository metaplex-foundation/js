import {
  createSerializerFromBeet,
  DateTime,
  mapSerializer,
  toDateTime,
} from '@/types';
import { StartDate, startDateBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
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
