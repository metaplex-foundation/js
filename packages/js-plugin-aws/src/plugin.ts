import type { S3Client } from '@aws-sdk/client-s3';
import type { MetaplexPlugin } from '@metaplex-foundation/js-core';
import type { Metaplex } from '@metaplex-foundation/js-core/Metaplex';
import { AwsStorageDriver } from './AwsStorageDriver';

export const awsStorage = (
  client: S3Client,
  bucketName: string
): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.storage().setDriver(new AwsStorageDriver(client, bucketName));
  },
});
