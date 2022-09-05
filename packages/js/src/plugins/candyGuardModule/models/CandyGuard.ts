import { Metaplex } from '@/Metaplex';
import {
  AccountInfo,
  assertModel,
  createSerializerFromSolitaType,
  deserializeAccount,
  isModel,
  Model,
  Pda,
  PublicKey,
  toAccountInfo,
  UnparsedAccount,
} from '@/types';
import {
  CandyGuard as MplCandyGuard,
  candyGuardBeet,
} from '@metaplex-foundation/mpl-candy-guard';
import { CANDY_GUARD_DATA } from '../constants';
import { CandyGuardsSettings } from '../guards';

/** @group Models */
export type CandyGuard<T extends CandyGuardsSettings> = Model<'candyGuard'> & {
  /** The PDA address of the Candy Guard account. */
  readonly address: Pda;

  /** Blockchain data of the Candy Guard account. */
  readonly accountInfo: AccountInfo;

  /** The address used to derive the Candy Guard's PDA. */
  readonly baseAddress: PublicKey;

  /** The address allowed to update the Candy Guard account */
  readonly authorityAddress: PublicKey;

  /** TODO. */
  readonly guards: T;

  /** TODO. */
  readonly groups: T[];
};

/** @group Model Helpers */
export const isCandyGuard = <T extends CandyGuardsSettings>(
  value: any
): value is CandyGuard<T> => isModel('candyGuard', value);

/** @group Model Helpers */
export function assertCandyGuard<T extends CandyGuardsSettings>(
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

  const { guards, groups } = metaplex
    .candyGuards()
    .guards()
    .deserializeSettings<T>(
      account.data.slice(CANDY_GUARD_DATA),
      account.owner
    );

  return {
    model: 'candyGuard',
    address: new Pda(parsedCandyGuard.publicKey, parsedCandyGuard.data.bump),
    accountInfo: toAccountInfo(account),
    baseAddress: parsedCandyGuard.data.base,
    authorityAddress: parsedCandyGuard.data.authority,
    guards,
    groups,
  };
};
