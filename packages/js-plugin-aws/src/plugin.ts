import type { S3Client } from '@aws-sdk/client-s3';
import type {
  Metaplex as MetaplexType,
  MetaplexPlugin,
} from '@metaplex-foundation/js';
import { AwsStorageDriver } from './AwsStorageDriver';

export const awsStorage = (
  client: S3Client,
  bucketName: string
): MetaplexPlugin => ({
  install(metaplex: MetaplexType) {
    metaplex.storage().setDriver(new AwsStorageDriver(client, bucketName));
  },
});
