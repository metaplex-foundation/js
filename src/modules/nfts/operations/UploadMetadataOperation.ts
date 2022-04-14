import { MetaplexFile } from '../../../drivers/index.js';
import { Operation } from '../../../shared/index.js';
import { JsonMetadata } from '../models/index.js';

export class UploadMetadataOperation extends Operation<UploadMetadataInput, UploadMetadataOutput> {}

export type UploadMetadataInput = JsonMetadata<MetaplexFile | string>;

export interface UploadMetadataOutput {
  metadata: JsonMetadata;
  uri: string;
}
