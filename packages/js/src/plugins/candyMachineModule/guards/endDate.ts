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

/**
 * The "Amount" end setting allows us to end a Candy Machine
 * after a certain amount of items have been minted.
 *
 * @group Models
 */
export type EndSettingsGuardSettingsAmount = {
  /** Differentiates the types of end settings. */
  type: 'amount';

  /** The maximum number of items to mint. */
  number: BigNumber;
};

/**
 * The "Date" end setting allows us to end a Candy Machine
 * after a given date and time.
 *
 * @group Models
 */
export type EndSettingsGuardSettingsDate = {
  /** Differentiates the types of end settings. */
  type: 'date';

  /** The date after which the Candy Machine is closed. */
  date: DateTime;
};

/** @internal */
export const endSettingsGuardManifest: CandyGuardManifest<EndSettingsGuardSettings> =
  {
    name: 'endSettings',
    settingsBytes: 9,
    settingsSerializer: mapSerializer<EndSettings, EndSettingsGuardSettings>(
      createSerializerFromBeet(endSettingsBeet),
      (settings) =>
        settings.endSettingType === EndSettingType.Date
          ? {
              type: 'date',
              date: toDateTime(settings.number),
            }
          : {
              type: 'amount',
              number: toBigNumber(settings.number),
            },
      (settings) => ({
        endSettingType:
          settings.type === 'date'
            ? EndSettingType.Date
            : EndSettingType.Amount,
        number: settings.type === 'date' ? settings.date : settings.number,
      })
    ),
  };
