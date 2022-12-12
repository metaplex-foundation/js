import type { DownloaderInterface } from './DownloaderInterface';
import type { EddsaInterface } from './EddsaInterface';
import type { HttpInterface } from './HttpInterface';
import type { ProgramRepositoryInterface } from './ProgramRepositoryInterface';
import type { RpcInterface } from './RpcInterface';
import type { SerializerInterface } from './SerializerInterface';
import type { Signer } from './Signer';
import type { TransactionFactoryInterface } from './TransactionFactoryInterface';
import type { UploaderInterface } from './UploaderInterface';

export interface Context {
  http: HttpInterface;
  rpc: RpcInterface;
  uploader: UploaderInterface;
  downloader: DownloaderInterface;
  programs: ProgramRepositoryInterface;
  transactions: TransactionFactoryInterface;
  eddsa: EddsaInterface;
  identity: Signer;
  serializer: SerializerInterface;
}
