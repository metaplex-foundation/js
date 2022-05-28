import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { lamports, Amount } from '@/types';
import { MetaplexFile, StorageDriver } from '../storageModule';

export class AwsStorageDriver implements StorageDriver {
  protected client: S3Client;
  protected bucketName: string;

  constructor(client: S3Client, bucketName: string) {
    this.client = client;
    this.bucketName = bucketName;
  }

  async getUploadPrice(_bytes: number): Promise<Amount> {
    return lamports(0);
  }

  async upload(file: MetaplexFile): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: file.uniqueName,
      Body: file.buffer,
    });

    try {
      await this.client.send(command);

      return await this.getUrl(file.uniqueName);
    } catch (err) {
      // TODO: Custom errors.
      throw err;
    }
  }

  async getUrl(key: string) {
    const region = await this.client.config.region();
    const encodedKey = encodeURIComponent(key);

    return `https://s3.${region}.amazonaws.com/${this.bucketName}/${encodedKey}`;
  }
}
