import {
  createSerializerFromBeet,
  lamports,
  mapSerializer,
  SolAmount,
} from '@/types';
import { BotTax, botTaxBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/**
 * The botTax guard ...
 *
 * This object defines the settings that should be
 * provided when creating and/or updating a Candy
 * Machine if you wish to enable this guard.
 */
export type BotTaxGuardSettings = {
  lamports: SolAmount;
  lastInstruction: boolean;
};

/** @internal */
export const botTaxGuardManifest: CandyGuardManifest<BotTaxGuardSettings> = {
  name: 'botTax',
  settingsBytes: 9,
  settingsSerializer: mapSerializer<BotTax, BotTaxGuardSettings>(
    createSerializerFromBeet(botTaxBeet),
    (settings) => ({ ...settings, lamports: lamports(settings.lamports) }),
    (settings) => ({ ...settings, lamports: settings.lamports.basisPoints })
  ),
};
