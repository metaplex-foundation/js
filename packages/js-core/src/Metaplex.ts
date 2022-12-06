import type { Context } from './Context';
import type { MetaplexPlugin } from './MetaplexPlugin';
import { NullUploader } from './UploaderInterface';

export interface Metaplex extends Pick<Context, 'uploader'> {
  use(plugin: MetaplexPlugin): Metaplex;
}

export const createMetaplex = (): Metaplex => {
  return {
    uploader: new NullUploader(),
    use(plugin: MetaplexPlugin) {
      plugin.install(this);
      return this;
    },
  };
};
