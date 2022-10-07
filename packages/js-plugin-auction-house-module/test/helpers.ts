import type { Metaplex } from '@metaplex-foundation/js-core/Metaplex';
import { CreateAuctionHouseInput } from '@metaplex-foundation/js-core/plugins';
import { sol, Signer } from '@metaplex-foundation/js-core';

export const createAuctionHouse = async (
  mx: Metaplex,
  auctioneerAuthority?: Signer | null,
  input: Partial<CreateAuctionHouseInput> = {}
) => {
  const { auctionHouse } = await mx
    .auctionHouse()
    .create({
      sellerFeeBasisPoints: 200,
      auctioneerAuthority: auctioneerAuthority?.publicKey,
      ...input,
    })
    .run();

  await mx.rpc().airdrop(auctionHouse.feeAccountAddress, sol(100));

  return auctionHouse;
};
