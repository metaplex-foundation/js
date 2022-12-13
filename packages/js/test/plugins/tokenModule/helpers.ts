import { Test } from 'tape';
import {
  Amount,
  formatAmount,
  isEqualToAmount,
  Token,
  TokenWithMint,
} from '@/index';
import type { Metaplex } from '@/Metaplex';

export const assertTokenHasAmount = (
  t: Test,
  token: Token | TokenWithMint,
  amount: Amount
) => {
  t.true(
    isEqualToAmount(token.amount, amount),
    `token has amount: ${formatAmount(amount)}`
  );
};

export const assertRefreshedTokenHasAmount = async (
  t: Test,
  metaplex: Metaplex,
  token: Token | TokenWithMint,
  amount: Amount
) => {
  const refreshedToken = await refreshToken(metaplex, token);
  assertTokenHasAmount(t, refreshedToken, amount);
};

export const refreshToken = (
  metaplex: Metaplex,
  token: Token | TokenWithMint
) => {
  return metaplex.tokens().findTokenByAddress({ address: token.address });
};
