import { MetaplexFile } from '@/drivers';
import { Operation, useOperation } from '@/shared';
import { JsonMetadata } from '../models';

export const uploadMetadataOperation =
  useOperation<UploadMetadataOperation>('UploadMetadataOperation');

export type UploadMetadataOperation = Operation<
  'UploadMetadataOperation',
  UploadMetadataInput,
  UploadMetadataOutput
>;

export type UploadMetadataInput = JsonMetadata<MetaplexFile | string>;

export interface UploadMetadataOutput {
  metadata: JsonMetadata;
  uri: string;
}
