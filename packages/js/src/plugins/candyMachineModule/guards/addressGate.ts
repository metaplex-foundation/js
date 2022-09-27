import { createSerializerFromBeet } from '@/types';
import {
  AddressGate,
  addressGateBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/**
 * The addressGate guard ...
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export type AddressGateGuardSettings = AddressGate;

/** @internal */
export const addressGateGuardManifest: CandyGuardManifest<AddressGateGuardSettings> =
  {
    name: 'addressGate',
    settingsBytes: 32,
    settingsSerializer: createSerializerFromBeet(addressGateBeet),
  };
