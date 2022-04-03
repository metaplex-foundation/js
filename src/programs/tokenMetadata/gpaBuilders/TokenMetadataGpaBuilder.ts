import BN from 'bn.js';
import { GpaBuilder } from '@/shared';
import { Key } from '@metaplex-foundation/mpl-token-metadata';
import { MetadataV1GpaBuilder } from './MetadataV1GpaBuilder';

export class TokenMetadataGpaBuilder extends GpaBuilder {
  whereKey(key: Key) {
    return this.where(0, new BN(key, 'le'));
  }

  metadataV1Accounts() {
    return MetadataV1GpaBuilder.from(this).whereKey(Key.MetadataV1);
  }

  masterEditionV1Accounts() {
    return this.whereKey(Key.MasterEditionV1);
  }

  masterEditionV2Accounts() {
    return this.whereKey(Key.MasterEditionV1);
  }
}
