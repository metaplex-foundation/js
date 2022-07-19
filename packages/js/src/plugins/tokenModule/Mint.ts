import type { PublicKey } from '@solana/web3.js';
import { amount, SplTokenCurrency, SplTokenAmount } from '@/types';
import { assert, Option } from '@/utils';
import { MintAccount } from './accounts';
import { WRAPPED_SOL_MINT } from './constants';

export type Mint = Readonly<{
  model: 'mint';
  address: PublicKey;
  mintAuthorityAddress: Option<PublicKey>;
  freezeAuthorityAddress: Option<PublicKey>;
  decimals: number;
  supply: SplTokenAmount;
  isWrappedSol: boolean;
  currency: SplTokenCurrency;
}>;

export const isMint = (value: any): value is Mint =>
  typeof value === 'object' && value.model === 'mint';

export function assertMint(value: any): asserts value is Mint {
  assert(isMint(value), `Expected Mint model`);
}
export const toMint = (account: MintAccount): Mint => {
  const isWrappedSol = account.publicKey.equals(WRAPPED_SOL_MINT);
  const currency: SplTokenCurrency = {
    symbol: isWrappedSol ? 'SOL' : 'Token',
    decimals: account.data.decimals,
    namespace: 'spl-token',
  };

  return {
    model: 'mint',
    address: account.publicKey,
    mintAuthorityAddress: account.data.mintAuthorityOption
      ? account.data.mintAuthority
      : null,
    freezeAuthorityAddress: account.data.freezeAuthorityOption
      ? account.data.freezeAuthority
      : null,
    decimals: account.data.decimals,
    supply: amount(account.data.supply.toString(), currency),
    isWrappedSol,
    currency,
  };
};
