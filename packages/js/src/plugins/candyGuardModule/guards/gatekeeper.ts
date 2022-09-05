import { createSerializerFromBeet } from '@/types';
import {
  Gatekeeper,
  gatekeeperBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type GatekeeperGuardSettings = Gatekeeper;

/** @internal */
export const gatekeeperGuardManifest: CandyGuardManifest<Gatekeeper> = {
  name: 'gatekeeper',
  settingsBytes: 0, // TODO: set real value.
  settingsSerializer: createSerializerFromBeet(gatekeeperBeet),
};
