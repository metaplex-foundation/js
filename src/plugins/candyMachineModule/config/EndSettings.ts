import {
  EndSettings,
  EndSettingType,
} from '@metaplex-foundation/mpl-candy-machine';
import BN from 'bn.js';
import { convertToMillisecondsSinceEpoch } from '@/types';

export const ENDSETTING_DATE = 'date';
export const ENDSETTING_AMOUNT = 'amount';
export const EndSettingModes = [ENDSETTING_DATE, ENDSETTING_AMOUNT] as const;
export type EndSettingMode = typeof EndSettingModes[number];
/**
 * Configures {@link CandyMachineConfig.endSettings}
 *
 * End Settings provides a mechanism to stop the mint if a certain condition is
 * met without interaction.
 *
 * @property endSettingType - {@link EndSettingMode} (date or amount) which identifies
 * what {@link EndSettingsConfig.value} means
 * @property value - to test the end condition. This will be either a date
 * string (end DateTime) or an integer amount (items minted)
 * */
export type EndSettingsConfig =
  | {
      endSettingType: typeof ENDSETTING_DATE;
      value: string;
    }
  | {
      endSettingType: typeof ENDSETTING_AMOUNT;
      value: number;
    };

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
