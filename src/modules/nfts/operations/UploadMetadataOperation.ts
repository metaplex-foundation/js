import { MetaplexFile } from '@/drivers/index';
import { Operation } from '@/shared/index';
import { JsonMetadata } from '../models/index';

export class UploadMetadataOperation extends Operation<UploadMetadataInput, UploadMetadataOutput> {}

export type UploadMetadataInput = JsonMetadata<MetaplexFile | string>;

export interface UploadMetadataOutput {
  metadata: JsonMetadata;
  uri: string;
}
