import { createSerializerFromBeet } from '@/types';
import {
  EndSettings,
  endSettingsBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type EndSettingsGuardSettings = EndSettings;

/** @internal */
export const endSettingsGuardManifest: CandyGuardManifest<EndSettings> = {
  name: 'end_settings',
  settingsBytes: 9,
  settingsSerializer: createSerializerFromBeet(endSettingsBeet),
};
