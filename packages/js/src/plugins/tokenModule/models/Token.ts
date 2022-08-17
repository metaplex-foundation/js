import type { PublicKey } from '@solana/web3.js';
import { amount, Pda, SplTokenAmount, token } from '@/types';
import { assert, Option } from '@/utils';
import { TokenAccount } from '../accounts';
import { Mint } from './Mint';
import { findAssociatedTokenAccountPda } from '../pdas';
import { AccountState } from '@solana/spl-token';

/** @group Models */
export type Token = {
  readonly model: 'token';
  readonly address: PublicKey | Pda;
  readonly isAssociatedToken: boolean;
  readonly mintAddress: PublicKey;
  readonly ownerAddress: PublicKey;
  readonly amount: SplTokenAmount;
  readonly closeAuthorityAddress: Option<PublicKey>;
  readonly delegateAddress: Option<PublicKey>;
  readonly delegateAmount: SplTokenAmount;
  readonly state: AccountState;
};

/** @group Model Helpers */
export const isToken = (value: any): value is Token =>
  typeof value === 'object' && value.model === 'token';

/** @group Model Helpers */
export function assertToken(value: any): asserts value is Token {
  assert(isToken(value), `Expected Token model`);
}

/** @group Model Helpers */
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
    amount: token(account.data.amount.toString()),
    closeAuthorityAddress: account.data.closeAuthorityOption
      ? account.data.closeAuthority
      : null,
    delegateAddress: account.data.delegateOption ? account.data.delegate : null,
    delegateAmount: token(account.data.delegatedAmount.toString()),
    state: account.data.state,
  };
};

/** @group Models */
export type TokenWithMint = Omit<Token, 'model' | 'mintAddress'> &
  Readonly<{
    model: 'tokenWithMint';
    mint: Mint;
  }>;

/** @group Model Helpers */
export const isTokenWithMint = (value: any): value is TokenWithMint =>
  typeof value === 'object' && value.model === 'tokenWithMint';

/** @group Model Helpers */
export function assertTokenWithMint(
  value: any
): asserts value is TokenWithMint {
  assert(isTokenWithMint(value), `Expected TokenWithMint model`);
}

/** @group Model Helpers */
export const toTokenWithMint = (
  tokenAccount: TokenAccount,
  mintModel: Mint
): TokenWithMint => {
  const token = toToken(tokenAccount);
  return {
    ...token,
    model: 'tokenWithMint',
    mint: mintModel,
    amount: amount(token.amount.basisPoints, mintModel.currency),
    delegateAmount: amount(
      token.delegateAmount.basisPoints,
      mintModel.currency
    ),
  };
};
