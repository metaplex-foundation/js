import type { S3Client } from '@aws-sdk/client-s3';
import type { MetaplexPlugin } from '@/types';
import type { Metaplex } from '@/index';

import { AwsStorageDriver } from './AwsStorageDriver';

export const awsStorage = (
  client: S3Client,
  bucketName: string
): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.storage().setDriver(new AwsStorageDriver(client, bucketName));
  },
});
