import { MetaplexFile } from '@/drivers';
import { Operation } from '@/shared';
import { JsonMetadata } from '../models';

export class UploadMetadataOperation extends Operation<UploadMetadataInput, UploadMetadataOutput> {}

export type UploadMetadataInput = JsonMetadata<MetaplexFile | string>;

export interface UploadMetadataOutput {
  metadata: JsonMetadata;
  uri: string;
}
