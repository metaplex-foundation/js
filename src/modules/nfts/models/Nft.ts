import { Model } from "@/modules/shared";
import { MasterEditionV2, Metadata } from "../generated";

export class Nft extends Model {

  /** The Metadata PDA account defining the NFT. */
  public readonly metadataAccount: Metadata;

  /** The optional Metadata Edition PDA account associated with the NFT. */
  public readonly masterEditionAccount: MasterEditionV2 | null;

  constructor(metadataAccount: Metadata, masterEditionAccount: MasterEditionV2 | null = null) {
    super();
    this.metadataAccount = metadataAccount;
    this.masterEditionAccount = masterEditionAccount;
  }
}
