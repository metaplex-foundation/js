import type { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { amount, Amount, Pda } from '@/types';
import { assert, Option } from '@/utils';
import { TokenAccount } from './accounts';
import { Mint } from './Mint';
import { findAssociatedTokenAccountPda } from '@/programs';

export type Token = Readonly<{
  model: 'token';
  address: PublicKey | Pda;
  isAssociatedToken: boolean;
  mintAddress: PublicKey;
  ownerAddress: PublicKey;
  amount: BN;
  closeAuthorityAddress: Option<PublicKey>;
  delegateAddress: Option<PublicKey>;
  delegateAmount: BN;
}>;

export const isTokenModel = (value: any): value is Token =>
  typeof value === 'object' && value.model === 'token';

export const assertTokenModel = (value: any): asserts value is Token =>
  assert(isTokenModel(value), `Expected Token model`);

export const makeTokenModel = (account: TokenAccount): Token => {
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
    amount: new BN(account.data.amount.toString()),
    closeAuthorityAddress: account.data.closeAuthorityOption
      ? account.data.closeAuthority
      : null,
    delegateAddress: account.data.delegateOption ? account.data.delegate : null,
    delegateAmount: new BN(account.data.delegatedAmount.toString()),
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

export const isTokenWithMintModel = (value: any): value is TokenWithMint =>
  typeof value === 'object' && value.model === 'tokenWithMint';

export const assertTokenWithMintModel = (
  value: any
): asserts value is TokenWithMint =>
  assert(isTokenWithMintModel(value), `Expected TokenWithMint model`);

export const makeTokenWithMintModel = (
  tokenAccount: TokenAccount,
  mintModel: Mint
): TokenWithMint => {
  const token = makeTokenModel(tokenAccount);
  return {
    ...token,
    model: 'tokenWithMint',
    mint: mintModel,
    amount: amount(token.amount, mintModel.currency),
    delegateAmount: amount(token.delegateAmount, mintModel.currency),
  };
};
