import {
  BigNumber,
  createSerializerFromBeet,
  mapSerializer,
  toBigNumber,
} from '@/types';
import {
  RedemeedAmount,
  redemeedAmountBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type RedeemedAmountGuardSettings = {
  maximum: BigNumber;
};

/** @internal */
export const redeemedAmountGuardManifest: CandyGuardManifest<RedeemedAmountGuardSettings> =
  {
    name: 'redemeedAmount', // TODO: Rename to "redeemedAmount" when typo fixed on the Program.
    settingsBytes: 8,
    settingsSerializer: mapSerializer<
      RedemeedAmount,
      RedeemedAmountGuardSettings
    >(
      createSerializerFromBeet(redemeedAmountBeet),
      (settings) => ({ maximum: toBigNumber(settings.maximum) }),
      (settings) => settings
    ),
  };
