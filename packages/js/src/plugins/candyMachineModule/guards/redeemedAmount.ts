import {
  RedeemedAmount,
  redeemedAmountBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { BN } from 'bn.js';
import { CandyGuardManifest } from './core';
import { createSerializerFromBeet, mapSerializer, toBigInt } from '@/types';

/**
 * The redeemedAmount guard forbids minting when the
 * number of minted NFTs for the entire Candy Machine
 * reaches the configured maximum amount.
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export type RedeemedAmountGuardSettings = {
  /** The maximum amount of NFTs that can be minted using that guard. */
  maximum: bigint;
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
      (settings) => ({ maximum: toBigInt(settings.maximum.toString()) }),
      (settings) => ({ maximum: new BN(settings.maximum.toString()) })
    ),
  };
