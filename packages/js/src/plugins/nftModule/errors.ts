import { MetaplexError, MetaplexErrorInputWithoutSource } from '@/errors';
import { PublicKey } from '@solana/web3.js';

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

export class OwnerMustBeProvidedAsASignerError extends NftError {
  constructor(cause?: Error) {
    super({
      cause,
      key: 'owner_must_be_provided_as_a_signer',
      title: 'Owner Must Be Provided As A Signer',
      problem:
        'The operation you are using allows you to provide the owner as a PublicKey ' +
        'or a Signer but in this scenario, the owner must be given as a Signer.',
      solution: 'Please provide the Owner as a Signer.',
    });
  }
}

export class ParentCollectionMissingError extends NftError {
  constructor(mint: PublicKey, operation: string, cause?: Error) {
    super({
      cause,
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
