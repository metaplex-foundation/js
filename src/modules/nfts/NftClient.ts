import { ModuleClient } from "@/modules/shared";
import { Nft, FindNftParams, findNft, CreateNftParams, createNft } from "@/modules/nfts";

export class NftClient extends ModuleClient {

  async createNft(params: CreateNftParams): Promise<string> {
    // TODO: Fetch and return Nft object.
    return createNft(this.metaplex, params);
  }

  async findNft(params: FindNftParams): Promise<Nft | null> {
    return findNft(this.metaplex, params);
  }
}
