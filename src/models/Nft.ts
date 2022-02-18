import { Model } from "./Model";
import { MetadataAccount, MetadataEditionAccount } from "./accounts";

export class Nft extends Model {

  /** The Metadata PDA account defining the NFT. */
  public readonly metadataAccount: MetadataAccount;

  /** The optional Metadata Edition PDA account associated with the NFT. */
  public readonly metadataEditionAccount: MetadataEditionAccount | null;

  constructor(metadataAccount: MetadataAccount, metadataEditionAccount: MetadataEditionAccount | null = null) {
    super();
    this.metadataAccount = metadataAccount;
    this.metadataEditionAccount = metadataEditionAccount;
  }
}
