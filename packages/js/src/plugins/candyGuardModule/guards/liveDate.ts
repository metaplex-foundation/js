import {
  createSerializerFromBeet,
  DateTime,
  mapSerializer,
  toOptionDateTime,
} from '@/types';
import { Option } from '@/utils';
import { Beet } from '@metaplex-foundation/beet';
import { LiveDate, liveDateBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type LiveDateGuardSettings = {
  date: Option<DateTime>;
};

/** @internal */
export const liveDateGuardManifest: CandyGuardManifest<LiveDateGuardSettings> =
  {
    name: 'liveDate',
    settingsBytes: 9,
    settingsSerializer: mapSerializer<LiveDate, LiveDateGuardSettings>(
      createSerializerFromBeet(liveDateBeet as Beet<LiveDate>),
      (settings) => ({ date: toOptionDateTime(settings.date) }),
      (settings) => settings
    ),
  };
