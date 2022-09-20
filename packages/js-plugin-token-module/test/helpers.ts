import { Test } from 'tape';
import {
  formatAmount,
  isEqualToAmount,
  SplTokenAmount,
  Token,
  TokenWithMint,
} from '@metaplex-foundation/js/index';
import type { Metaplex } from '@metaplex-foundation/js';

export const assertTokenHasAmount = (
  t: Test,
  token: Token | TokenWithMint,
  amount: SplTokenAmount
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
  amount: SplTokenAmount
) => {
  const refreshedToken = await refreshToken(metaplex, token);
  assertTokenHasAmount(t, refreshedToken, amount);
};

export const refreshToken = (
  metaplex: Metaplex,
  token: Token | TokenWithMint
) => {
  return metaplex.tokens().findTokenByAddress({ address: token.address }).run();
};
