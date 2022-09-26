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

/** TODO */
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
