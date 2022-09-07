import { Option } from '@/utils';
import {
  AccountInfo,
  assertModel,
  BigNumber,
  isModel,
  Model,
  PublicKey,
  UnparsedAccount,
} from '@/types';

/**
 * This model contains all the relevant information about a Candy Machine.
 * This includes its settings but also all of the items (a.k.a. config lines)
 * loaded inside the Candy Machine along with some statistics about the items.
 *
 * @group Models
 */
export type CandyMachine = Model<'candyMachine'> & {
  /** The address of the Candy Machine account. */
  readonly address: PublicKey;

  /** Blockchain data of the Candy Machine account. */
  readonly accountInfo: AccountInfo;

  /**
   * The address of the only authority that is allowed to mint from
   * this Candy Machine. This will refer to the address of the Candy
   * Guard associated with the Candy Machine if any.
   */
  readonly authorityAddress: PublicKey;

  /**
   * The address of the authority allowed to manage the Candy Machine.
   */
  readonly updateAuthorityAddress: PublicKey;

  /**
   * The address of the wallet receiving the payments for minted NFTs.
   * If the Candy Machine accepts payments in SOL, this is the SOL treasury account.
   * Otherwise, this is the token account associated with the treasury Mint.
   */
  readonly walletAddress: PublicKey;

  /**
   * The address of the Mint account of the SPL Token that should be used
   * to accept payments for minting NFTs. When `null`, it means the
   * Candy Machine account accepts payments in SOL.
   */
  readonly tokenMintAddress: Option<PublicKey>;

  /**
   * The mint address of the collection NFT that should be associated with
   * minted NFTs. When `null`, it means NFTs will not be part of a
   * collection when minted.
   */
  readonly collectionMintAddress: Option<PublicKey>;

  /**
   * The total number of items availble in the Candy Machine, minted or not.
   */
  readonly itemsAvailable: BigNumber;

  /**
   * The number of items that have been minted on this Candy Machine so far.
   */
  readonly itemsMinted: BigNumber;

  /**
   * The number of remaining items in the Candy Machine that can still be minted.
   */
  readonly itemsRemaining: BigNumber;

  /**
   * The number of items that have been inserted in the Candy Machine by
   * its update authority. If this number if lower than the number of items
   * available, the Candy Machine is not ready and cannot be minted from.
   *
   * This field is irrelevant if the Candy Machine is using hidden settings.
   */
  readonly itemsLoaded: BigNumber;

  /**
   * Whether all items in the Candy Machine have been inserted by
   * its authority.
   *
   * This field is irrelevant if the Candy Machine is using hidden settings.
   */
  readonly isFullyLoaded: boolean;

  /**
   * This array of booleans is used to keep track of which
   * new features have been enabled on the Candy Machine.
   */
  readonly featureFlags: FeatureFlags; // TODO
};

/** @group Model Helpers */
export const isCandyMachine = (value: any): value is CandyMachine =>
  isModel('candyMachine', value);

/** @group Model Helpers */
export function assertCandyMachine(value: any): asserts value is CandyMachine {
  assertModel(isCandyMachine(value), `Expected CandyMachine model`);
}

/** @group Model Helpers */
export const toCandyMachine = (account: UnparsedAccount): CandyMachine => {
  return {
    // TODO
  };
};
