import test from 'tape';
import { Amman } from '@metaplex-foundation/amman-client';
import { logDebug } from '@metaplex-foundation/js-core';

export const amman = Amman.instance({ log: logDebug });

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
