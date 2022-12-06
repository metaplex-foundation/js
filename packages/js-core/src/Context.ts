import { DownloaderInterface } from './DownloaderInterface';
import { EddsaInterface } from './EddsaInterface';
import { HttpInterface } from './HttpInterface';
import { ProgramRepositoryInterface } from './ProgramRepositoryInterface';
import { RpcInterface } from './RpcInterface';
import { Signer } from './Signer';
import { TransactionFactoryInterface } from './TransactionFactoryInterface';
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
  // serializer: SerializerInterface;
  // bigNumber: BigNumberInterface;
}
