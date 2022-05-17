import { PublicKey } from '@solana/web3.js';
import {
  MetaplexError,
  MetaplexErrorInputWithoutSource,
} from './MetaplexError';

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

export class NftNotFoundError extends NftError {
  constructor(mint: PublicKey, cause?: Error) {
    super({
      cause,
      key: 'nft_not_found',
      title: 'NFT Not Found',
      problem:
        'No Metadata account could be found for the provided mint address: ' +
        `[${mint.toBase58()}].`,
      solution:
        'Ensure the provided mint address is valid and that an associated ' +
        'Metadata account exists on the blockchain.',
    });
  }
}
