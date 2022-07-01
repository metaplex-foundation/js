import { HiddenSettings } from '@metaplex-foundation/mpl-candy-machine';

export function hiddenSettingsFromConfig(
  config?: HiddenSettingsConfig
): HiddenSettings | undefined {
  if (config == null) return undefined;
  const hash = Buffer.from(config.hash, 'utf8').toJSON().data;
  return { ...config, hash };
}
