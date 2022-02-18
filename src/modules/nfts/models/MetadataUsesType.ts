import { BeetStruct, fixedScalarEnum, FixedSizeBeet, u64 } from '@metaplex-foundation/beet'
import { UseMethod } from '@metaplex-foundation/mpl-token-metadata';
import BN from 'bn.js';

export class MetadataUsesType {
  useMethod: UseMethod;
  total: BN;
  remaining: BN;

  constructor(args: MetadataUsesType) {
    this.useMethod = args.useMethod
    this.total = args.total
    this.remaining = args.remaining
  }

  static readonly struct = new BeetStruct<MetadataUsesType>(
    [
      ['useMethod', fixedScalarEnum(UseMethod) as FixedSizeBeet<UseMethod, UseMethod>],
      ['total', u64],
      ['remaining', u64],
    ],
    (args) => new MetadataUsesType(args as MetadataUsesType),
    'MetadataUsesType'
  )
}
