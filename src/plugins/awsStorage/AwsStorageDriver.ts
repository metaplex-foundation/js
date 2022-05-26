import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Metaplex } from '@/Metaplex';
import { StorageDriver, useLamports, Amount } from '@/types';
import { MetaplexFile } from '../storageModule';

export const useAwsStorageDriver = (
  metaplex: Metaplex,
  client: S3Client,
  bucketName: string
): StorageDriver => {
  const getUrl = async (key: string) => {
    const region = await client.config.region();
    const encodedKey = encodeURIComponent(key);

    return `https://s3.${region}.amazonaws.com/${bucketName}/${encodedKey}`;
  };

  return {
    metaplex,

    getUploadPrice: async (_bytes: number): Promise<Amount> => {
      return useLamports(0);
    },

    upload: async (file: MetaplexFile): Promise<string> => {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: file.uniqueName,
        Body: file.toBuffer(),
      });

      try {
        await client.send(command);

        return await getUrl(file.uniqueName);
      } catch (err) {
        // TODO: Custom errors.
        throw err;
      }
    },
  };
};
