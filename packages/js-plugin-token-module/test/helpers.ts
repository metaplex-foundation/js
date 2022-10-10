import { Test } from 'tape';
import {
  formatAmount,
  isEqualToAmount,
  SplTokenAmount,
} from '@metaplex-foundation/js-core';
import type { Metaplex } from '@metaplex-foundation/js-core/Metaplex';
import { Token, TokenWithMint } from '../src/models/Token';
import test from 'tape';
import { Amman } from '@metaplex-foundation/amman-client';
import { logDebug } from '@metaplex-foundation/js-core';

export const amman = Amman.instance({ log: logDebug });

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

/**
 * This is a workaround the fact that web3.js doesn't close it's socket connection and provides no way to do so.
 * Therefore the process hangs for a considerable time after the tests finish, increasing the feedback loop.
 *
 * This fixes this by exiting the process as soon as all tests are finished.
 */
export function killStuckProcess() {
  // Don't do this in CI since we need to ensure we get a non-zero exit code if tests fail
  if (process.env.CI == null) {
    test.onFinish(() => process.exit(0));
  }
}
