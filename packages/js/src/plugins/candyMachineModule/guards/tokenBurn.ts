import {
  BigNumber,
  createSerializerFromBeet,
  DateTime,
  mapSerializer,
  toBigNumber,
  toDateTime,
} from '@/types';
import {
  EndSettings,
  endSettingsBeet,
  EndSettingType,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type EndSettingsGuardSettings =
  | EndSettingsGuardSettingsAmount
  | EndSettingsGuardSettingsDate;

/** @internal */
export const endSettingsGuardManifest: CandyGuardManifest<EndSettingsGuardSettings> =
  {
    name: 'endSettings',
    settingsBytes: 9,
    settingsSerializer: mapSerializer<EndSettings, EndSettingsGuardSettings>(
      createSerializerFromBeet(endSettingsBeet),
      (settings) => settings,
      (settings) => settings
    ),
  };
