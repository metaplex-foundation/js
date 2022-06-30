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

export type MintAccount = Account<SplMintAccount>;
export const parseMintAccount = getAccountParsingFunction(mintAccountParser);
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

export type TokenAccount = Account<SplTokenAccount>;
export const parseTokenAccount = getAccountParsingFunction(tokenAccountParser);
export const toTokenAccount =
  getAccountParsingAndAssertingFunction(tokenAccountParser);
