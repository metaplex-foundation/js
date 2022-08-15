import {
  Account,
  AccountParser,
  getAccountParsingAndAssertingFunction,
  getAccountParsingFunction,
} from '@/types';
import {
  RawAccount as SplTokenAccount,
  AccountLayout as SplTokenAccountLayout,
  RawMint as SplMintAccount,
  MintLayout as SplMintAccountLayout,
} from '@solana/spl-token';

const mintAccountParser: AccountParser<SplMintAccount> = {
  name: 'MintAccount',
  deserialize: (data: Buffer, offset?: number) => {
    const span = SplMintAccountLayout.getSpan(data, offset);
    const decoded = SplMintAccountLayout.decode(data, offset);
    return [decoded, span];
  },
};

/** @group Accounts */
export type MintAccount = Account<SplMintAccount>;

/** @group Account Helpers */
export const parseMintAccount = getAccountParsingFunction(mintAccountParser);

/** @group Account Helpers */
export const toMintAccount =
  getAccountParsingAndAssertingFunction(mintAccountParser);

const tokenAccountParser: AccountParser<SplTokenAccount> = {
  name: 'TokenAccount',
  deserialize: (data: Buffer, offset?: number) => {
    const span = SplTokenAccountLayout.getSpan(data, offset);
    const decoded = SplTokenAccountLayout.decode(data, offset);
    return [decoded, span];
  },
};

/** @group Accounts */
export type TokenAccount = Account<SplTokenAccount>;

/** @group Account Helpers */
export const parseTokenAccount = getAccountParsingFunction(tokenAccountParser);

/** @group Account Helpers */
export const toTokenAccount =
  getAccountParsingAndAssertingFunction(tokenAccountParser);
