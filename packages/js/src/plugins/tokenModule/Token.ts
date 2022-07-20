import type { PublicKey } from '@solana/web3.js';
import { amount, Amount, BigNumber, Pda, toBigNumber } from '@/types';
import { assert, Option } from '@/utils';
import { TokenAccount } from './accounts';
import { Mint } from './Mint';
import { findAssociatedTokenAccountPda } from './pdas';

export type Token = Readonly<{
  model: 'token';
  address: PublicKey | Pda;
  isAssociatedToken: boolean;
  mintAddress: PublicKey;
  ownerAddress: PublicKey;
  amount: BigNumber;
  closeAuthorityAddress: Option<PublicKey>;
  delegateAddress: Option<PublicKey>;
  delegateAmount: BigNumber;
}>;

export const isToken = (value: any): value is Token =>
  typeof value === 'object' && value.model === 'token';

export function assertToken(value: any): asserts value is Token {
  assert(isToken(value), `Expected Token model`);
}
export const toToken = (account: TokenAccount): Token => {
  const associatedTokenAddress = findAssociatedTokenAccountPda(
    account.data.mint,
    account.data.owner
  );
  const isAssociatedToken = associatedTokenAddress.equals(account.publicKey);

  return {
    model: 'token',
    address: isAssociatedToken ? associatedTokenAddress : account.publicKey,
    isAssociatedToken,
    mintAddress: account.data.mint,
    ownerAddress: account.data.owner,
    amount: toBigNumber(account.data.amount.toString()),
    closeAuthorityAddress: account.data.closeAuthorityOption
      ? account.data.closeAuthority
      : null,
    delegateAddress: account.data.delegateOption ? account.data.delegate : null,
    delegateAmount: toBigNumber(account.data.delegatedAmount.toString()),
  };
};

export type TokenWithMint = Omit<
  Token,
  'model' | 'mintAddress' | 'amount' | 'delegateAmount'
> &
  Readonly<{
    model: 'tokenWithMint';
    mint: Mint;
    amount: Amount;
    delegateAmount: Amount;
  }>;

export const isTokenWithMint = (value: any): value is TokenWithMint =>
  typeof value === 'object' && value.model === 'tokenWithMint';

export function assertTokenWithMint(
  value: any
): asserts value is TokenWithMint {
  assert(isTokenWithMint(value), `Expected TokenWithMint model`);
}

export const toTokenWithMint = (
  tokenAccount: TokenAccount,
  mintModel: Mint
): TokenWithMint => {
  const token = toToken(tokenAccount);
  return {
    ...token,
    model: 'tokenWithMint',
    mint: mintModel,
    amount: amount(token.amount, mintModel.currency),
    delegateAmount: amount(token.delegateAmount, mintModel.currency),
  };
};
