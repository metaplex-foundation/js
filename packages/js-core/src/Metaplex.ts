import type { Context } from './Context';
import { NullDownloader } from './DownloaderInterface';
import type { MetaplexPlugin } from './MetaplexPlugin';
import { NullUploader } from './UploaderInterface';

export interface Metaplex extends Pick<Context, 'uploader' | 'downloader'> {
  use(plugin: MetaplexPlugin): Metaplex;
}

export const createMetaplex = (): Metaplex => {
  return {
    uploader: new NullUploader(),
    downloader: new NullDownloader(),
    use(plugin: MetaplexPlugin) {
      plugin.install(this);
      return this;
    },
  };
};
