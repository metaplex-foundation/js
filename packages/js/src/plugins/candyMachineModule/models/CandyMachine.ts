import {
  AccountInfo,
  assertModel,
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
   * The address of the wallet receiving the payments for minted NFTs.
   * If the Candy Machine accepts payments in SOL, this is the SOL treasury account.
   * Otherwise, this is the token account associated with the treasury Mint.
   */
  readonly walletAddress: PublicKey;

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
