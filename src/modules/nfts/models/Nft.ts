import { Model } from "@/modules/shared";
import { AccountInfo } from "@solana/web3.js";
import { MasterEditionV1, MasterEditionV2, Metadata } from "../generated";

export class Nft extends Model {

  /** The Metadata PDA account defining the NFT. */
  public readonly metadata: AccountInfo<Metadata>;

  /** The optional Metadata Edition PDA account associated with the NFT. */
  public readonly masterEdition: AccountInfo<MasterEditionV1 | MasterEditionV2> | null;

  constructor(metadata: AccountInfo<Metadata>, masterEdition: AccountInfo<MasterEditionV1 | MasterEditionV2> | null = null) {
    super();
    this.metadata = metadata;
    this.masterEdition = masterEdition;
  }
}
