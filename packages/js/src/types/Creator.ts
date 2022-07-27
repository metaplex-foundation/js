import { PublicKey } from '@solana/web3.js';
import { Option } from '@/utils';

export type Creator = Readonly<{
  address: PublicKey;
  verified: boolean;
  share: number;
}>;

export const toUniformCreators = (...addresses: PublicKey[]): Creator[] => {
  const shareFloor = Math.floor(100 / addresses.length);
  const shareModulo = 100 % addresses.length;

  return addresses.map((address, index) => ({
    address,
    verified: false,
    share: index < shareModulo ? shareFloor + 1 : shareFloor,
  }));
};

export const toNullCreators = (creators: Creator[]): Option<Creator[]> => {
  return creators === [] ? null : creators;
};

export const toUniformVerifiedCreators = (
  ...addresses: PublicKey[]
): Creator[] => {
  return toUniformCreators(...addresses).map((creator) => ({
    ...creator,
    verified: true,
  }));
};
