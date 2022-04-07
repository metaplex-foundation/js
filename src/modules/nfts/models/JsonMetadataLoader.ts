import { Metaplex } from "@/Metaplex";
import { Loader } from "@/shared";
import { removeEmptyChars } from "@/utils";
import { JsonMetadata } from "./JsonMetadata";
import { Nft } from "./Nft";

export class JsonMetadataLoader extends Loader {
  protected nft: Nft;

  constructor(nft: Nft) {
    super();
    this.nft = nft;
  }

  public async handle(metaplex: Metaplex) {
    const uri = removeEmptyChars(this.nft.metadataAccount.data.data.uri);

    try {
      const metadata = await metaplex.storage().downloadJson<JsonMetadata>(uri);
      Object.assign(this, metadata);
    } catch (error) {
      return;
    }
  }
}
