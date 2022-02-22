import { Model, MetadataAccount, MasterEditionAccount } from "@/modules/shared";

export class Nft extends Model {

  /** The Metadata PDA account defining the NFT. */
  public readonly metadata: MetadataAccount;

  /** The optional Metadata Edition PDA account associated with the NFT. */
  public readonly masterEdition: MasterEditionAccount | null;

  constructor(metadata: MetadataAccount, masterEdition: MasterEditionAccount | null = null) {
    super();
    this.metadata = metadata;
    this.masterEdition = masterEdition;
  }
}
