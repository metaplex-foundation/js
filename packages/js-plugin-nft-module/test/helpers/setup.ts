import { Metaplex } from '@metaplex-foundation/js-core';
import { CreateSftInput } from '../../src/operations/createSft';
import { UploadMetadataInput } from '../../src/operations/uploadMetadata';

export const createSft = async (
  mx: Metaplex,
  input: Partial<CreateSftInput & { json: UploadMetadataInput }> = {}
) => {
  const { uri } = await mx
    .nfts()
    .uploadMetadata(input.json ?? {})
    .run();

  const { sft } = await mx
    .nfts()
    .createSft({
      uri,
      name: 'My SFT',
      sellerFeeBasisPoints: 200,
      ...input,
    })
    .run();

  return sft;
};
