import type { Metaplex } from '@/Metaplex';
import { CreateAuctionHouseInput } from '@/plugins';
import { sol } from '@/types';

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

  await mx.rpc().airdrop(auctionHouse.feeAccount, sol(100));

  return {
    auctionHouse,
    client: mx.auctions().for(auctionHouse),
  };
};
