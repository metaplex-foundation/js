import type { Metaplex } from '@metaplex-foundation/js';

import { CreateAuctionHouseInput } from '@metaplex-foundation/js/plugins';
import { sol, Signer } from '@metaplex-foundation/js';

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
