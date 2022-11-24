import { DownloaderInterface } from './DownloaderInterface';
import { HttpInterface } from './HttpInterface';
import { RpcInterface } from './RpcInterface';
import { UploaderInterface } from './UploaderInterface';

export interface Context {
  http: HttpInterface;
  rpc: RpcInterface;
  uploader: UploaderInterface;
  downloader: DownloaderInterface;
}
