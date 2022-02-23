import { ModuleClient } from "@/modules/shared";
import { Nft, FindNftParams, findNft, CreateNftParams, createNft } from "@/modules/nfts";

export class NftClient extends ModuleClient {

  async createNft(params: CreateNftParams): Promise<Nft> {
    return createNft(this.metaplex, params);
  }

  async findNft(params: FindNftParams): Promise<Nft | null> {
    return findNft(this.metaplex, params);
  }
}
