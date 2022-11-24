import { DownloaderInterface } from './DownloaderInterface';
import { EddsaInterface } from './EddsaInterface';
import { HttpInterface } from './HttpInterface';
import { ProgramRepositoryInterface } from './ProgramRepositoryInterface';
import { RpcInterface } from './RpcInterface';
import { TransactionFactoryInterface } from './TransactionFactoryInterface';
import { UploaderInterface } from './UploaderInterface';

export interface Context {
  http: HttpInterface;
  rpc: RpcInterface;
  uploader: UploaderInterface;
  downloader: DownloaderInterface;
  programs: ProgramRepositoryInterface;
  transactions: TransactionFactoryInterface;
  eddsa: EddsaInterface;
}
