// -----------------
// Whitelist Mint Settings

import BN from 'bn.js';
import { PublicKeyString } from '../../../../shared';

// -----------------
export const BURN_EVERY_TIME = 'burnEveryTime';
export const NEVER_BURN = 'neverBurn';

export const WhitelistModes = [BURN_EVERY_TIME, NEVER_BURN] as const;

/**
 * Whitelist Modes
 *
 * burnEveryTime - Whitelist token is burned after the mint
 * neverBurn - Whitelist token is returned to holder
 */
export type WhitelistMode = typeof WhitelistModes[number];

/**
 * Whitelist Mint Settings
 *
 * @property mode - {@link WhitelistMode} (burnEveryTime or neverBurn)
 * @property mint - Mint address of the whitelist token
 * @property presale - Indicates whether whitelist token holders can mint before goLiveDate
 * @property discountPrice - Price for whitelist token holders
 */
export type WhitelistMintSettingsConfig = {
  mode: WhitelistMode;
  mint: PublicKeyString;
  presale: boolean;
  discountPrice: BN;
};
