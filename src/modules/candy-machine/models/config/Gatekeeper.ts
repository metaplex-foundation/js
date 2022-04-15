import { GatekeeperConfig } from '@metaplex-foundation/mpl-candy-machine';
import { tryConvertToPublickKey } from '../../../../shared';

/**
 * Configures {@link CandyMachineConfig.gatekeeper} settings.
 *
 * @property gatekeeperNetwork - Gateway provider address
 * @property expireOnUse - Requires a new gateway challenge after a use
 */
export type GatekeeperSettingsConfig = {
  gatekeeperNetwork: string;
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
