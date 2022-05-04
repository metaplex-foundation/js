import { HiddenSettings } from '@metaplex-foundation/mpl-candy-machine';

/**
 * Configures {@link CandyMachineConfig.hiddenSettings}
 *
 * Hidden settings serve two purposes. First, it allows the creation of larger
 * drops (20k+), since the metadata is not stored on-chain. In turn, this also
 * allows the creation of hide-and-reveal drops, where users discover which
 * item(s) they minted after the mint is complete.
 *
 * Once hidden settings are enabled, every mint will have the same URI and the
 * name will be created by appending the mint number (e.g., “#45”) to the name
 * specified. The hash is expected to be a 32 character string corresponding to
 * the hash of a cache file that has the mapping between a mint number and the
 * actual metadata URI. This allows the order of the mint to be verified by
 * others after the mint is complete.
 *
 * Since the metadata is not on-chain, it is possible to create very large
 * drops. The only caveat is that there is a need for an off-chain process to
 * update the metadata for each item. This is important otherwise all items
 * will have the same metadata.
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

export function hiddenSettingsFromConfig(
  config?: HiddenSettingsConfig
): HiddenSettings | undefined {
  if (config == null) return undefined;
  const hash = Buffer.from(config.hash, 'utf8').toJSON().data;
  return { ...config, hash };
}
