import {
  MetaplexError,
  MetaplexErrorInputWithoutSource,
  MetaplexErrorOptions,
} from '@/errors';
import { PublicKey } from '@solana/web3.js';

/** @group Errors */
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

/** @group Errors */
export class ParentCollectionMissingError extends NftError {
  constructor(
    mint: PublicKey,
    operation: string,
    options?: MetaplexErrorOptions
  ) {
    super({
      options,
      key: 'parent_collection_missing',
      title: 'Parent Collection Missing',
      problem:
        `You are trying to send the operation [${operation}] which requires the NFT to have ` +
        `a parent collection but that is not the case for the NFT at address [${mint}].`,
      solution:
        'Ensure the NFT you are interacting with has a parent collection.',
    });
  }
}
