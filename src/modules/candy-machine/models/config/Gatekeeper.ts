import { GatekeeperConfig } from '@metaplex-foundation/mpl-candy-machine';
import { PublicKeyString, tryConvertToPublickKey } from '../../../../shared';

/**
 * Configures {@link CandyMachineConfig.gatekeeper} settings.
 *
 * @property gatekeeperNetwork - Gateway provider address
 * @property expireOnUse - Requires a new gateway challenge after a use
 */
export type GatekeeperSettingsConfig = {
  gatekeeperNetwork: PublicKeyString;
  expireOnUse: boolean;
};

export function gatekeeperFromConfig(
  config?: GatekeeperSettingsConfig
): GatekeeperConfig | undefined {
  if (config == null) return undefined;

  return {
    ...config,
    gatekeeperNetwork: tryConvertToPublickKey(config.gatekeeperNetwork),
  };
}
