import { u16, fixedSizeUtf8String, uniformFixedSizeArray, coption, FixableBeetStruct } from '@metaplex-foundation/beet'
import { MAX_CREATOR_LEN, MAX_NAME_LENGTH, MAX_SYMBOL_LENGTH, MAX_URI_LENGTH } from '@metaplex-foundation/mpl-token-metadata'
import { MetadataCollectionType, MetadataCreatorType, MetadataUsesType } from '@/modules/nfts';

export class MetadataDataV2Type {
  public name: string;
  public symbol: string;
  public uri: string;
  public sellerFeeBasisPoints: number;
  public creators: MetadataCreatorType[] | null;
  public collection: MetadataCollectionType | null;
  public uses: MetadataUsesType | null;

  constructor(args: MetadataDataV2Type) {
    this.name = args.name
    this.symbol = args.symbol
    this.uri = args.uri
    this.sellerFeeBasisPoints = args.sellerFeeBasisPoints
    this.creators = args.creators
    this.collection = args.collection
    this.uses = args.uses
  }

  static readonly struct = new FixableBeetStruct<MetadataDataV2Type>(
    [
      ['name', fixedSizeUtf8String(MAX_NAME_LENGTH)],
      ['symbol', fixedSizeUtf8String(MAX_SYMBOL_LENGTH)],
      ['uri', fixedSizeUtf8String(MAX_URI_LENGTH)],
      ['sellerFeeBasisPoints', u16],
      ['creators', coption(uniformFixedSizeArray(MetadataCreatorType.struct, MAX_CREATOR_LEN))],
      ['collection', coption(MetadataCollectionType.struct)],
      ['uses', coption(MetadataUsesType.struct)],
    ],
    (args) => new MetadataDataV2Type(args as MetadataDataV2Type),
    'MetadataDataV2Type'
  )
}
