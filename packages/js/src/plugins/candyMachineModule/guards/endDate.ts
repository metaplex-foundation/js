import {
  createSerializerFromBeet,
  DateTime,
  mapSerializer,
  toDateTime,
} from '@/types';
import { EndDate, endDateBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/**
 * The endDate guard ...
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export type EndDateGuardSettings = {
  date: DateTime;
};

/** @internal */
export const endDateGuardManifest: CandyGuardManifest<EndDateGuardSettings> = {
  name: 'endDate',
  settingsBytes: 8,
  settingsSerializer: mapSerializer<EndDate, EndDateGuardSettings>(
    createSerializerFromBeet(endDateBeet),
    (settings) => ({ date: toDateTime(settings.date) }),
    (settings) => settings
  ),
};
