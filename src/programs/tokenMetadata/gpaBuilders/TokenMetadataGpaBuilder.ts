import BN from "bn.js";
import { GpaBuilder } from "@/programs/shared";
import { Key } from "../generated/types";
import { MetadataV1GpaBuilder, MasterEditionV1GpaBuilder, MasterEditionV2GpaBuilder } from ".";

export class TokenMetadataGpaBuilder extends GpaBuilder {
  whereKey(key: Key) {
    return this.where(0, new BN(key, 'le'));
  }

  whereMetadataV1() {
    return MetadataV1GpaBuilder.from(this).whereKey(Key.MetadataV1);
  }

  whereMasterEditionV1() {
    return MasterEditionV1GpaBuilder.from(this).whereKey(Key.MasterEditionV1);
  }

  whereMasterEditionV2() {
    return MasterEditionV2GpaBuilder.from(this).whereKey(Key.MasterEditionV1);
  }
}
