import { MetaplexFile } from '@/drivers';
import { useOperation } from '@/shared';
import { JsonMetadata } from '../models';

export const uploadMetadataOperation = useOperation<UploadMetadataInput, UploadMetadataOutput>(
  'uploadMetadataOperation'
);

export type UploadMetadataInput = JsonMetadata<MetaplexFile | string>;

export interface UploadMetadataOutput {
  metadata: JsonMetadata;
  uri: string;
}
