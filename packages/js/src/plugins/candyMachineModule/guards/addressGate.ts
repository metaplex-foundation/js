import { createSerializerFromBeet } from '@/types';
import {
  AddressGate,
  addressGateBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type AddressGateGuardSettings = AddressGate;

/** @internal */
export const addressGateGuardManifest: CandyGuardManifest<AddressGateGuardSettings> =
  {
    name: 'addressGate',
    settingsBytes: 32,
    settingsSerializer: createSerializerFromBeet(addressGateBeet),
  };
