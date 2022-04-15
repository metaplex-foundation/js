/**
 * Configures {@link CandyMachineConfig.hiddenSettings}
 *
 * @property name - Name of the mint. The number of the mint will be appended to the name.
 * @property uri - Single URI for all mints.
 * @property hash - 32 character hash. In most cases this is the hash of the cache file with
 * the mapping between mint number and metadata so that the order can be verified when the mint
 * is complete
 */
export type HiddenSettingsConfig = {
  name: string;
  uri: string;
  // Uint8Array
  hash: string;
};
