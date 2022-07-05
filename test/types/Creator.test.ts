import { Keypair, PublicKey } from '@solana/web3.js';
import test, { Test } from 'tape';
import { Creator, toUniformCreators, toUniformVerifiedCreators } from '@/index';

test('[Creator] it can create single creators', (t: Test) => {
  const creator = Keypair.generate().publicKey;
  const creators = toUniformCreators(creator);
  assertCreatorCount(t, creators, 1);
  assertCreator(t, creators[0], creator, 100);
  t.end();
});

test('[Creator] it can create verified creators', (t: Test) => {
  const creator = Keypair.generate().publicKey;
  const creators = toUniformVerifiedCreators(creator);
  assertCreatorCount(t, creators, 1);
  assertCreator(t, creators[0], creator, 100, true);
  t.end();
});

test('[Creator] it can create multiple creators with uniformed shares', (t: Test) => {
  const creatorA = Keypair.generate().publicKey;
  const creatorB = Keypair.generate().publicKey;
  const creators = toUniformCreators(creatorA, creatorB);
  assertCreatorCount(t, creators, 2);
  assertCreator(t, creators[0], creatorA, 50);
  assertCreator(t, creators[1], creatorB, 50);
  assertCreatorSharesAddUpTo100Percent(t, creators);
  t.end();
});

test('[Creator] it give the extra share to the first creator when share is 33.33%', (t: Test) => {
  // Test with 33.33% share.
  const addresses = getAddresses(3);
  const creators = toUniformCreators(...addresses);
  assertCreatorCount(t, creators, 3);
  assertCreator(t, creators[0], addresses[0], 34);
  assertCreator(t, creators[1], addresses[1], 33);
  assertCreator(t, creators[2], addresses[2], 33);
  assertCreatorSharesAddUpTo100Percent(t, creators);
  t.end();
});

test('[Creator] it give the extra share to the first creators when uniformed share as decimals', (t: Test) => {
  // Test with 14.29% share.
  const addresses = getAddresses(7);
  const creators = toUniformCreators(...addresses);
  assertCreatorCount(t, creators, 7);
  assertCreator(t, creators[0], addresses[0], 15);
  assertCreator(t, creators[1], addresses[1], 15);
  assertCreator(t, creators[2], addresses[2], 14);
  assertCreator(t, creators[3], addresses[3], 14);
  assertCreator(t, creators[4], addresses[4], 14);
  assertCreator(t, creators[5], addresses[5], 14);
  assertCreator(t, creators[6], addresses[6], 14);
  assertCreatorSharesAddUpTo100Percent(t, creators);
  t.end();
});

const getAddresses = (count: number) => {
  return new Array(count).fill(0).map(() => Keypair.generate().publicKey);
};

const assertCreatorCount = (t: Test, creators: Creator[], count: number) => {
  t.equals(creators.length, count, 'has correct amount of creators');
};

const assertCreatorSharesAddUpTo100Percent = (t: Test, creators: Creator[]) => {
  const sum = creators.reduce((sum, creator) => sum + creator.share, 0);
  t.equals(sum, 100, 'has shares that add up to 100%');
};

const assertCreator = (
  t: Test,
  creator: Creator,
  address: PublicKey,
  share: number,
  verified: boolean = false
) => {
  t.ok(creator.address.equals(address), 'has correct address');
  t.equals(creator.share, share, 'has correct share');
  t.equals(creator.verified, verified, 'has correct verified');
};
