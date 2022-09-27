import { createSerializerFromBeet } from '@/types';
import {
  AddressGate,
  addressGateBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/**
 * The settings for the addressGate guard that should
 * be provided when creating and/or updating
 * a Candy Machine or a Candy Guard directly.
 */
export type AddressGateGuardSettings = AddressGate;

/** @internal */
export const addressGateGuardManifest: CandyGuardManifest<AddressGateGuardSettings> =
  {
    name: 'addressGate',
    settingsBytes: 32,
    settingsSerializer: createSerializerFromBeet(addressGateBeet),
  };
