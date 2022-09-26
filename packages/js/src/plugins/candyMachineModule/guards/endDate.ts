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
export const endSettingsGuardManifest: CandyGuardManifest<EndDateGuardSettings> =
  {
    name: 'endSettings',
    settingsBytes: 8,
    settingsSerializer: mapSerializer<EndDate, EndDateGuardSettings>(
      createSerializerFromBeet(endDateBeet),
      (settings) => ({ date: toDateTime(settings.date) }),
      (settings) => settings
    ),
  };
