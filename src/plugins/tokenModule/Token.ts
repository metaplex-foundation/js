import type { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { amount, Amount, Pda } from '@/types';
import { assert, Option } from '@/utils';
import { TokenAccount } from './accounts';
import { Mint } from './Mint';

export type Token = Readonly<{
  model: 'token';
  address: PublicKey | Pda;
  isAssociatedToken: boolean;
  mintAddress: PublicKey;
  ownerAddress: PublicKey;
  amount: BN; // TODO(loris): Replace with Amount on TokenWithX?
  closeAuthorityAddress: Option<PublicKey>;
  delegateAddress: Option<PublicKey>;
  delegateAmount: BN; // TODO(loris): Replace with Amount on TokenWithX?
}>;

export const isTokenModel = (value: any): value is Token =>
  typeof value === 'object' && value.model === 'token';

export const assertTokenModel = (value: any): asserts value is Token =>
  assert(isTokenModel(value), `Expected Token model`);

export const makeTokenModel = (
  account: TokenAccount,
  associatedAddress?: Pda
): Token => ({
  model: 'token',
  address: associatedAddress ?? account.publicKey,
  isAssociatedToken: !!associatedAddress,
  mintAddress: account.data.mint,
  ownerAddress: account.data.owner,
  amount: new BN(account.data.amount.toString()),
  closeAuthorityAddress: account.data.closeAuthorityOption
    ? account.data.closeAuthority
    : null,
  delegateAddress: account.data.delegateOption ? account.data.delegate : null,
  delegateAmount: new BN(account.data.delegatedAmount.toString()),
});

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
  mintModel: Mint,
  associatedAddress?: Pda
): TokenWithMint => {
  const token = makeTokenModel(tokenAccount, associatedAddress);
  return {
    ...token,
    model: 'tokenWithMint',
    mint: mintModel,
    amount: amount(token.amount, mintModel.currency),
    delegateAmount: amount(token.delegateAmount, mintModel.currency),
  };
};
