import { Pda } from '@/types';
import { assert } from '@/utils';
import { Metadata } from './Metadata';
import { Mint } from '../tokenModule';
import { NftEdition } from './NftEdition';

export type Nft = Omit<Metadata, 'model' | 'address' | 'jsonLoaded'> &
  Readonly<{
    model: 'nft';
    lazy: false;
    jsonLoaded: true;
    metadataAddress: Pda;
    mint: Mint;
    edition: NftEdition;
  }>;

export const isNft = (value: any): value is Nft =>
  typeof value === 'object' && value.model === 'nft';

export const assertNft = (value: any): asserts value is Nft =>
  assert(isNft(value), `Expected Nft model`);

export const toNft = (
  metadata: Metadata & { jsonLoaded: true },
  mint: Mint,
  edition: NftEdition
): Nft => ({
  ...metadata,
  model: 'nft',
  lazy: false,
  metadataAddress: metadata.address,
  mint,
  edition,
});

export type LazyNft = Omit<Nft, 'lazy' | 'mint' | 'edition' | 'jsonLoaded'> &
  Readonly<{
    lazy: true;
    jsonLoaded: false;
  }>;
