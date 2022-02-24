import { ModuleClient } from "@/modules/shared";
import { Nft, FindNftParams, findNft, CreateNftParams, createNft } from "@/modules/nfts";

export class NftClient extends ModuleClient {

  async createNft(params: CreateNftParams): Promise<Nft> {
    const { mint } = await createNft(this.metaplex, params);

    return this.findNftOrFail({ mint: mint.publicKey });
  }

  async findNft(params: FindNftParams): Promise<Nft | null> {
    return findNft(this.metaplex, params);
  }

  async findNftOrFail(params: FindNftParams): Promise<Nft> {
    const nft = await this.findNft(params);

    if (!nft) {
      // TODO: failIfNull() helper method.
      // TODO: Custom errors.
      throw new Error('Nft not found');
    }

    return nft;
  }
}
