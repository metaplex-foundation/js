import {
  AccountInfo,
  assertModel,
  BigNumber,
  deserializeAccountFromBeetClass,
  isModel,
  Model,
  Pda,
  PublicKey,
  toAccountInfo,
  toBigNumber,
  UnparsedAccount,
} from '@/types';
import {
  CandyGuard as MplCandyGuard,
  candyGuardBeet,
} from '@metaplex-foundation/mpl-candy-guard';

/** @group Models */
export type CandyGuard = Model<'candyGuard'> & {
  /** The PDA address of the Candy Guard account. */
  readonly address: Pda;

  /** Blockchain data of the Candy Guard account. */
  readonly accountInfo: AccountInfo;

  /** The address used to derive the Candy Guard's PDA. */
  readonly baseAddress: PublicKey;

  /** The address allowed to update the Candy Guard account */
  readonly authorityAddress: PublicKey;

  /** An array of boolean dictating which guards are activated. */
  readonly features: boolean[];
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
    accountInfo: toAccountInfo(account),
    baseAddress: parsedCandyGuard.data.base,
    authorityAddress: parsedCandyGuard.data.authority,
    features: featuresAsBooleanArray(
      toBigNumber(parsedCandyGuard.data.features)
    ),

    // TODO(loris): Parse the guard settings.
  };
};

const featuresAsBooleanArray = (features: BigNumber): boolean[] =>
  features
    .toString(2, features.byteLength() * 8)
    .split('')
    .map((x) => (x === '1' ? true : false));
