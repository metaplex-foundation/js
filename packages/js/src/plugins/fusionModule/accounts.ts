import { EscrowConstraintModel, Trifle } from 'mpl-trifle';
import {
  Account,
  getAccountParsingAndAssertingFunction,
  getAccountParsingFunction,
} from '@/types';

/** @group Accounts */
export type EscrowConstraintModelAccount = Account<EscrowConstraintModel>;

/** @group Account Helpers */
export const parseEscrowConstraintModelAccount = getAccountParsingFunction(
  EscrowConstraintModel
);

/** @group Account Helpers */
export const toEscrowConstraintModelAccount =
  getAccountParsingAndAssertingFunction(EscrowConstraintModel);

/** @group Accounts */
export type TrifleAccount = Account<Trifle>;

/** @group Account Helpers */
export const parseTrifleAccount = getAccountParsingFunction(Trifle);

/** @group Account Helpers */
export const toTrifleAccount = getAccountParsingAndAssertingFunction(Trifle);
