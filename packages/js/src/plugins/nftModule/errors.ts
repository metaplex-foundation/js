import { MetaplexError, MetaplexErrorInputWithoutSource } from '@/errors';

export class NftError extends MetaplexError {
  constructor(input: MetaplexErrorInputWithoutSource) {
    super({
      ...input,
      key: `plugin.nft.${input.key}`,
      title: `NFT > ${input.title}`,
      source: 'plugin',
      sourceDetails: 'NFT',
    });
  }
}
