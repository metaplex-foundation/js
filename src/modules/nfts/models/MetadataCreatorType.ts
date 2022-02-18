import { PublicKey } from '@solana/web3.js';
import { BeetStruct, u8 } from '@metaplex-foundation/beet'
import { publicKey } from '@metaplex-foundation/beet-solana';

export class MetadataCreatorType {
  public address: PublicKey;
  public verified: boolean;
  public share: number;

  constructor(args: MetadataCreatorType) {
    this.address = args.address
    this.verified = args.verified
    this.share = args.share
  }

  static readonly struct = new BeetStruct<MetadataCreatorType>(
    [
      ['address', publicKey],
      ['verified', u8],
      ['share', u8],
    ],
    (args) => new MetadataCreatorType(args as MetadataCreatorType),
    'MetadataCreatorType'
  )
}
