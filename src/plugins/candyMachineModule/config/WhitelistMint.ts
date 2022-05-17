import {
  WhitelistMintMode,
  WhitelistMintSettings,
} from '@metaplex-foundation/mpl-candy-machine';
import BN from 'bn.js';
import { PublicKeyString, convertToPublickKey } from '@/types';
import { UnreachableCaseError } from '@/errors';

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

 * Whitelist settings provide a variety of different use cases and revolve
 * around the idea of using custom SPL tokens to offer special rights to token
 * holders - how said SPL token is distributed is up to you. 
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
  discountPrice: number;
};

export function whiteListMintSettingsFromConfig(
  config?: WhitelistMintSettingsConfig
): WhitelistMintSettings | undefined {
  if (config == null) return undefined;
  let mode: WhitelistMintMode;
  switch (config.mode) {
    case BURN_EVERY_TIME:
      mode = WhitelistMintMode.BurnEveryTime;
      break;
    case NEVER_BURN:
      mode = WhitelistMintMode.NeverBurn;
      break;
    default:
      throw new UnreachableCaseError(config.mode);
  }
  const mint = convertToPublickKey(config.mint);
  const discountPrice = new BN(config.discountPrice);

  return { ...config, mode, mint, discountPrice };
}
