import { Metaplex } from '@/Metaplex';
import {
  AccountInfo,
  assertModel,
  BigNumber,
  createOptionNoneSerializer,
  createSerializerFromSolitaType,
  deserialize,
  deserializeAccount,
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
import { CandyGuardsSettings } from '../guards';

/** @group Models */
export type CandyGuard<Guards> = Model<'candyGuard'> & {
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

  /** TODO. */
  readonly guards: Guards;
};

/** @group Model Helpers */
export const isCandyGuard = <T>(value: any): value is CandyGuard<T> =>
  isModel('candyGuard', value);

/** @group Model Helpers */
export function assertCandyGuard<T>(
  value: any
): asserts value is CandyGuard<T> {
  assertModel(isCandyGuard(value), `Expected CandyGuard model`);
}

/** @group Model Helpers */
export const toCandyGuard = <T extends CandyGuardsSettings>(
  account: UnparsedAccount,
  metaplex: Metaplex
): CandyGuard<T> => {
  const candyGuardSerializer = createSerializerFromSolitaType(
    MplCandyGuard,
    candyGuardBeet.description
  );
  const parsedCandyGuard = deserializeAccount(account, candyGuardSerializer);

  const guards = metaplex
    .candyGuards()
    .guards()
    .deserializeSettings<T>(account.data, account.owner);

  return {
    model: 'candyGuard',
    address: new Pda(parsedCandyGuard.publicKey, parsedCandyGuard.data.bump),
    accountInfo: toAccountInfo(account),
    baseAddress: parsedCandyGuard.data.base,
    authorityAddress: parsedCandyGuard.data.authority,
    features: featuresAsBooleanArray(
      toBigNumber(parsedCandyGuard.data.features)
    ),
    guards,
  };
};

const featuresAsBooleanArray = (features: BigNumber): boolean[] =>
  features
    .toString(2, features.byteLength() * 8)
    .split('')
    .map((x) => (x === '1' ? true : false));
