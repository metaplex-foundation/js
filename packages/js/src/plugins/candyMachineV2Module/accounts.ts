import {
    CandyMachine,
    CollectionPDA,
} from '@metaplex-foundation/mpl-candy-machine';
import {
    Account,
    getAccountParsingAndAssertingFunction,
    getAccountParsingFunction,
    MaybeAccount,
} from '@/types';

/** @group Accounts */
export type CandyMachineV2Account = Account<CandyMachine>;

/** @group Account Helpers */
export const parseCandyMachineAccount = getAccountParsingFunction(CandyMachine);

/** @group Account Helpers */
export const toCandyMachineAccount =
    getAccountParsingAndAssertingFunction(CandyMachine);

/** @group Accounts */
export type CandyMachineCollectionAccount = Account<CollectionPDA>;

/** @group Accounts */
export type MaybeCandyMachineV2CollectionAccount = MaybeAccount<CollectionPDA>;

/** @group Account Helpers */
export const parseCandyMachineCollectionAccount =
    getAccountParsingFunction(CollectionPDA);

/** @group Account Helpers */
export const toCandyMachineCollectionAccount =
    getAccountParsingAndAssertingFunction(CollectionPDA);
