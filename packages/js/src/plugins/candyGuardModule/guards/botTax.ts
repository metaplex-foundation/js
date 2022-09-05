import { createSerializerFromBeet } from '@/types';
import { BotTax, botTaxBeet } from '@metaplex-foundation/mpl-candy-guard';
import { CandyGuardManifest } from './core';

/** TODO */
export type BotTaxGuardSettings = BotTax;

/** @internal */
export const botTaxGuardManifest: CandyGuardManifest<BotTax> = {
  name: 'bot_tax',
  settingsSerializer: createSerializerFromBeet(botTaxBeet),
};
