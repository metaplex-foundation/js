import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import test, { Test } from 'tape';
import sinon from 'sinon';
import { killStuckProcess, metaplex } from '../../helpers';
import { awsStorage, useMetaplexFile } from '@/index';

killStuckProcess();

const awsClient = {
  async send() {
    return {};
  },
  config: {
    async region() {
      return 'us-east';
    },
  },
} as unknown as S3Client;

test('it can upload assets to a S3 bucket', async (t: Test) => {
  // Given a mock awsClient.
  const stub = sinon.spy(awsClient);

  // Fed to a Metaplex instance.
  const mx = await metaplex();
  mx.use(awsStorage(awsClient, 'some-bucket'));

  // When we upload some content to AWS S3.
  const file = useMetaplexFile('some-image', 'some-image.jpg', {
    uniqueName: 'some-key',
  });
  const uri = await mx.storage().upload(file);

  // Then we get the URL of the uploaded asset.
  t.equals(uri, 'https://s3.us-east.amazonaws.com/some-bucket/some-key');
  t.assert(stub.send.calledOnce);
  const command = stub.send.getCall(0).args[0] as PutObjectCommand;
  t.assert(command instanceof PutObjectCommand);
  t.equals('some-bucket', command.input.Bucket);
  t.equals('some-key', command.input.Key);
  t.equals('some-image', command.input.Body?.toString());
});
