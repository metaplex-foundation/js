import { MetaplexFile } from '@/drivers';
import { NewOperation, useOperation } from '@/shared';
import { JsonMetadata } from '../models';

export const uploadMetadataOperation =
  useOperation<UploadMetadataOperation>('UploadMetadataOperation');

export type UploadMetadataOperation = NewOperation<
  'UploadMetadataOperation',
  UploadMetadataInput,
  UploadMetadataOutput
>;

export type UploadMetadataInput = JsonMetadata<MetaplexFile | string>;

export interface UploadMetadataOutput {
  metadata: JsonMetadata;
  uri: string;
}
