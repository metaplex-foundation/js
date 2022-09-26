import {
  createSerializerFromBeet,
  DateTime,
  mapSerializer,
  toDateTime,
} from '@/types';
import { EndDate, endDateBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
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
