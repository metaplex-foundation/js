import { S3Client } from '@aws-sdk/client-s3';
import { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import { useAwsStorageDriver } from './AwsStorageDriver';

export const awsStorage = (
  client: S3Client,
  bucketName: string
): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    metaplex.storage().setDriver(useAwsStorageDriver(client, bucketName));
  },
});
