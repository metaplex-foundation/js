import { PublicKey } from '@solana/web3.js';
import { BeetStruct, bool } from '@metaplex-foundation/beet'
import { publicKey } from '@metaplex-foundation/beet-solana';

export class MetadataCollectionType {
  verified: boolean;
  key: PublicKey;

  constructor(args: MetadataCollectionType) {
    this.verified = args.verified
    this.key = args.key
  }

  static readonly struct = new BeetStruct<MetadataCollectionType>(
    [
      ['verified', bool],
      ['key', publicKey],
    ],
    (args) => new MetadataCollectionType(args as MetadataCollectionType),
    'MetadataCollectionType'
  )
}
