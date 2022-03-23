import BN from 'bn.js';
import { GpaBuilder } from '@/programs/shared';
import { Key } from '../generated/types';
import { MetadataV1GpaBuilder } from '.';

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
