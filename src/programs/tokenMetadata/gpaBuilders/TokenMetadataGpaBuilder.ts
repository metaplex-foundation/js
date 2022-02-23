import BN from "bn.js";
import { GpaBuilder } from "@/programs/shared";
import { Key } from "../generated/types";

export class TokenMetadataGpaBuilder extends GpaBuilder {
  whereKey(key: Key) {
    return this.where(0, new BN(key, 'le'));
  }

  // TODO
  // whereMetadata()
  // whereMasterEditionV1()
  // whereMasterEditionV2()
  // whereMasterEdition() -> references latest version.
}
