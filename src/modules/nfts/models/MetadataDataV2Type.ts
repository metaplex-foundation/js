import { BeetStruct, u16, fixedSizeUtf8String } from '@metaplex-foundation/beet'
import { MAX_NAME_LENGTH, MAX_SYMBOL_LENGTH, MAX_URI_LENGTH } from '@metaplex-foundation/mpl-token-metadata'

export class MetadataDataV2Type {
  public name: string;
  public symbol: string;
  public uri: string;
  public sellerFeeBasisPoints: number;
  // creators: Creator[] | null;
  // collection: Collection | null;
  // uses: Uses | null;

  constructor(args: MetadataDataV2Type) {
    this.name = args.name
    this.symbol = args.symbol
    this.uri = args.uri
    this.sellerFeeBasisPoints = args.sellerFeeBasisPoints
  }

  static readonly struct = new BeetStruct<MetadataDataV2Type>(
    [
      ['name', fixedSizeUtf8String(MAX_NAME_LENGTH)],
      ['symbol', fixedSizeUtf8String(MAX_SYMBOL_LENGTH)],
      ['uri', fixedSizeUtf8String(MAX_URI_LENGTH)],
      ['sellerFeeBasisPoints', u16],
      // ['creators', todo],
      // ['collection', todo],
      // ['uses', todo],
      // ['creators', { kind: 'option', type: [Creator] }],
      // ['collection', { kind: 'option', type: Collection }],
      // ['uses', { kind: 'option', type: Uses }],
    ],
    (args) => new MetadataDataV2Type(args as MetadataDataV2Type),
    'MetadataDataV2Type'
  )
}
