import { Account, getAccountParsingFunction } from '@/types';
import {
  RawAccount as SplTokenAccount,
  AccountLayout as SplTokenAccountLayout,
  RawMint as SplMintAccount,
  MintLayout as SplMintAccountLayout,
} from '@solana/spl-token';

export type MintAccount = Account<SplMintAccount>;
export const parseMintAccount = getAccountParsingFunction({
  name: 'MintAccount',
  deserialize: (data: Buffer, offset?: number) => {
    const span = SplMintAccountLayout.getSpan(data, offset);
    const decoded = SplMintAccountLayout.decode(data, offset);
    return [decoded, span];
  },
});

export type TokenAccount = Account<SplTokenAccount>;
export const parseTokenAccount = getAccountParsingFunction({
  name: 'TokenAccount',
  deserialize: (data: Buffer, offset?: number) => {
    const span = SplTokenAccountLayout.getSpan(data, offset);
    const decoded = SplTokenAccountLayout.decode(data, offset);
    return [decoded, span];
  },
});
