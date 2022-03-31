import { StorageDriver } from './drivers/storage';
import { Metaplex } from './Metaplex';

export type MetaplexPlugin = {
  install(metaplex: Metaplex): any;
};

export function isMetaplexPlugin(
  pluginOrStorage: MetaplexPlugin | StorageDriver
): pluginOrStorage is MetaplexPlugin {
  return typeof (pluginOrStorage as MetaplexPlugin).install === 'function';
}
