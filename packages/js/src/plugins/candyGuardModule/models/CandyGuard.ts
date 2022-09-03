import {
  assertModel,
  deserializeAccountFromBeetClass,
  isModel,
  Model,
  Pda,
  PublicKey,
  UnparsedAccount,
} from '@/types';
import {
  CandyGuard as MplCandyGuard,
  candyGuardBeet,
} from '@metaplex-foundation/mpl-candy-guard';

/** @group Models */
export type CandyGuard = Model<'candyGuard'> & {
  /** The PDA address of the candy guard account. */
  readonly address: Pda;

  /** The address used to derive the candy guard's PDA. */
  readonly baseAddress: PublicKey;
};

/** @group Model Helpers */
export const isCandyGuard = (value: any): value is CandyGuard =>
  isModel('candyGuard', value);

/** @group Model Helpers */
export function assertCandyGuard(value: any): asserts value is CandyGuard {
  assertModel(isCandyGuard(value), `Expected CandyGuard model`);
}

/** @group Model Helpers */
export const toCandyGuard = (account: UnparsedAccount): CandyGuard => {
  const parsedCandyGuard = deserializeAccountFromBeetClass(
    account,
    MplCandyGuard,
    candyGuardBeet.description
  );

  return {
    model: 'candyGuard',
    address: new Pda(parsedCandyGuard.publicKey, parsedCandyGuard.data.bump),
    baseAddress: parsedCandyGuard.data.base,
  };
};
