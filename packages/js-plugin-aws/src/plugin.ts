import type { S3Client } from '@aws-sdk/client-s3';
import type { Metaplex, MetaplexPlugin } from '@metaplex-foundation/js';
import { AwsStorageDriver } from './AwsStorageDriver';

export const awsStorage = (
  client: S3Client,
  bucketName: string
): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.storage().setDriver(new AwsStorageDriver(client, bucketName));
  },
});
