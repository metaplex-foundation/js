import { createSerializerFromBeet, mapSerializer } from '@/types';
import { NftGate, nftGateBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type NftGateGuardSettings = NftGate;

/** @internal */
export const endSettingsGuardManifest: CandyGuardManifest<NftGateGuardSettings> =
  {
    name: 'nftGate',
    settingsBytes: 9,
    settingsSerializer: createSerializerFromBeet(nftGateBeet),
  };
