import { GatekeeperConfig } from '@metaplex-foundation/mpl-candy-machine';
import { PublicKeyString, convertToPublickKey } from '@/types';

/**
 * Configures {@link CandyMachineConfig.gatekeeper} settings.
 *
 * While the unpredictable mint index provides some protection against bots,
 * they are still able to mint directly from the Candy Machine. If you want to
 * make sure that only humans can mint from your project, gatekeeper settings
 * can be enabled.
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
    gatekeeperNetwork: convertToPublickKey(config.gatekeeperNetwork),
  };
}
