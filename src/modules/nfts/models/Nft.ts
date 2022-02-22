import { Model, Account } from "@/modules/shared";
import { MasterEditionV1, MasterEditionV2, Metadata } from "../generated";

export class Nft extends Model {

  /** The Metadata PDA account defining the NFT. */
  public readonly metadata: Account<Metadata>;

  /** The optional Metadata Edition PDA account associated with the NFT. */
  public readonly masterEdition: Account<MasterEditionV1 | MasterEditionV2> | null;

  constructor(metadata: Account<Metadata>, masterEdition: Account<MasterEditionV1 | MasterEditionV2> | null = null) {
    super();
    this.metadata = metadata;
    this.masterEdition = masterEdition;
  }
}
