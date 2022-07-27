import type { Metaplex } from '@/Metaplex';
import { CreateAuctionHouseInput } from '@/plugins';
import { sol, Signer } from '@/types';

export const createAuctionHouse = async (
  mx: Metaplex,
  auctioneerAuthority?: Signer | null,
  input: Partial<CreateAuctionHouseInput> = {}
) => {
  const { auctionHouse } = await mx
    .auctions()
    .createAuctionHouse({
      sellerFeeBasisPoints: 200,
      auctioneerAuthority: auctioneerAuthority?.publicKey,
      ...input,
    })
    .run();

  await mx.rpc().airdrop(auctionHouse.feeAccountAddress, sol(100));

  return {
    auctionHouse,
    client: mx.auctions().for(auctionHouse, auctioneerAuthority || undefined),
  };
};
