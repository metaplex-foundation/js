import { MetaplexFile } from '@/drivers';
import { Operation } from '@/shared';
import { JsonMetadata, JsonMetadataFile } from '../models';

export class UploadMetadataOperation extends Operation<UploadMetadataInput, UploadMetadataOutput> {}

export type UploadMetadataInput =
  | JsonMetadata
  | {
      image?: MetaplexFile;
      external_url?: MetaplexFile;
      properties?: {
        files?: (
          | JsonMetadataFile
          | {
              uri?: MetaplexFile;
            }
        )[];
      };
    };

export interface UploadMetadataOutput {
  metadata: JsonMetadata;
  uri: string;
}
