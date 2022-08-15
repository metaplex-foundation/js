import type { PublicKey } from '@solana/web3.js';
import { amount, SplTokenCurrency, SplTokenAmount } from '@/types';
import { assert, Option } from '@/utils';
import { MintAccount } from '../accounts';
import { WRAPPED_SOL_MINT } from '../constants';

/** @group Models */
export type Mint = {
  readonly model: 'mint';
  readonly address: PublicKey;
  readonly mintAuthorityAddress: Option<PublicKey>;
  readonly freezeAuthorityAddress: Option<PublicKey>;
  readonly decimals: number;
  readonly supply: SplTokenAmount;
  readonly isWrappedSol: boolean;
  readonly currency: SplTokenCurrency;
};

/** @group Model Helpers */
export const isMint = (value: any): value is Mint =>
  typeof value === 'object' && value.model === 'mint';

/** @group Model Helpers */
export function assertMint(value: any): asserts value is Mint {
  assert(isMint(value), `Expected Mint model`);
}

/** @group Model Helpers */
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
