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
 * The settings for the redeemedAmount guard that should
 * be provided when creating and/or updating
 * a Candy Machine or a Candy Guard directly.
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
