import {
  BigNumber,
  createSerializerFromBeet,
  mapSerializer,
  toBigNumber,
} from '@/types';
import {
  RedeemedAmount,
  redeemedAmountBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/**
 * The redeemedAmount guard ...
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export type RedeemedAmountGuardSettings = {
  maximum: BigNumber;
};

/** @internal */
export const redeemedAmountGuardManifest: CandyGuardManifest<RedeemedAmountGuardSettings> =
  {
    name: 'redeemedAmount',
    settingsBytes: 8,
    settingsSerializer: mapSerializer<
      RedeemedAmount,
      RedeemedAmountGuardSettings
    >(
      createSerializerFromBeet(redeemedAmountBeet),
      (settings) => ({ maximum: toBigNumber(settings.maximum) }),
      (settings) => settings
    ),
  };
