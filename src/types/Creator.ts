import { PublicKey } from '@solana/web3.js';

export type Creator = Readonly<{
  address: PublicKey;
  verified: boolean;
  share: number;
}>;

export const toUniformCreators = (...addresses: PublicKey[]): Creator[] => {
  const uniformShare = 100 / addresses.length;
  return addresses.map((address, index) => ({
    address,
    verified: false,
    share: index === 0 ? Math.ceil(uniformShare) : Math.floor(uniformShare),
  }));
};

export const toUniformVerifiedCreators = (
  ...addresses: PublicKey[]
): Creator[] => {
  return toUniformCreators(...addresses).map((creator) => ({
    ...creator,
    verified: true,
  }));
};
