import {
  WhitelistMintMode,
  WhitelistMintSettings,
} from '@metaplex-foundation/mpl-candy-machine';
import BN from 'bn.js';
import { PublicKeyString, convertToPublickKey } from '@/types';
import { UnreachableCaseError } from '@/errors';

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
