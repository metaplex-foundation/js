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
