import {
  EndSettings,
  EndSettingType,
} from '@metaplex-foundation/mpl-candy-machine';
import BN from 'bn.js';
import { convertToMillisecondsSinceEpoch } from '@/types';

export function endSettingsFromConfig(
  config?: EndSettingsConfig
): EndSettings | undefined {
  if (config == null) return undefined;
  const endSettingType =
    config.endSettingType === ENDSETTING_DATE
      ? EndSettingType.Date
      : EndSettingType.Amount;

  const value =
    config.endSettingType === ENDSETTING_DATE
      ? convertToMillisecondsSinceEpoch(config.value)
      : new BN(config.value);
  return {
    endSettingType,
    number: value,
  };
}
