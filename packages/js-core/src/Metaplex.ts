import type { Context } from './Context';
import { NullDownloader } from './DownloaderInterface';
import { NullEddsa } from './EddsaInterface';
import type { MetaplexPlugin } from './MetaplexPlugin';
import { NullSigner } from './Signer';
import { NullUploader } from './UploaderInterface';

export interface Metaplex
  extends Pick<Context, 'uploader' | 'downloader' | 'identity' | 'eddsa'> {
  use(plugin: MetaplexPlugin): Metaplex;
}

export const createMetaplex = (): Metaplex => {
  return {
    uploader: new NullUploader(),
    downloader: new NullDownloader(),
    identity: new NullSigner(),
    eddsa: new NullEddsa(),
    use(plugin: MetaplexPlugin) {
      plugin.install(this);
      return this;
    },
  };
};
