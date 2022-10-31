import type { Metaplex } from '@metaplex-foundation/js-core';
import { sol, Signer, OperationOptions } from '@metaplex-foundation/js-core';
import { auctionHouseModule, CreateAuctionHouseInput } from '../src';
import {
  metaplex as metaplexBase,
  MetaplexTestOptions,
} from '../../js-core/test/helpers';
export * from '../../js-core/test/helpers';

export const metaplex = async (options: MetaplexTestOptions = {}) => {
  return (await metaplexBase(options)).use(auctionHouseModule());
};

export const createAuctionHouse = async (
  mx: Metaplex,
  auctioneerAuthority?: Signer | null,
  input: Partial<CreateAuctionHouseInput> = {},
  options: OperationOptions = {}
) => {
  const { auctionHouse } = await mx.auctionHouse().create(
    {
      sellerFeeBasisPoints: 200,
      auctioneerAuthority: auctioneerAuthority?.publicKey,
      ...input,
    },
    options
  );

  await mx.rpc().airdrop(auctionHouse.feeAccountAddress, sol(100));

  return auctionHouse;
};
