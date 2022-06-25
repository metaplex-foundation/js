import type { Metaplex } from '@/Metaplex';
import { CreateAuctionHouseInput } from '@/plugins';

export const createAuctionHouse = async (
  mx: Metaplex,
  input: Partial<CreateAuctionHouseInput> = {}
) => {
  const { auctionHouse } = await mx
    .auctions()
    .createAuctionHouse({
      sellerFeeBasisPoints: 200,
      ...input,
    })
    .run();

  return {
    auctionHouse,
    client: mx.auctions().for(auctionHouse),
  };
};
