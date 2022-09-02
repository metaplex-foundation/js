import {
  PublicKey,
  UnparsedAccount,
  Model,
  isModel,
  assertModel,
  Pda,
  getAccountParsingAndAssertingFunction,
} from '@metaplex-foundation/js';
import { CandyGuard as MplCandyGuard } from '@metaplex-foundation/mpl-candy-guard';

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
  const toCandyGuard = getAccountParsingAndAssertingFunction(MplCandyGuard);
  const parsedCandyGuard = toCandyGuard(account);

  return {
    model: 'candyGuard',
    address: new Pda(parsedCandyGuard.publicKey, parsedCandyGuard.data.bump),
    baseAddress: parsedCandyGuard.data.base,
  };
};
