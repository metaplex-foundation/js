import test, { Test } from 'tape';
import { killStuckProcess, metaplex } from '../../helpers';
import { derivedIdentity } from '@/index';

killStuckProcess();

const init = async (message?: string) => {
  const mx = await metaplex();

  mx.use(derivedIdentity());

  if (message != null) {
    await mx.derivedIdentity().deriveFrom(message);
  }

  return mx;
};

test('[derivedIdentity] it derives the same address when using the same message', async (t: Test) => {
  const mx = await init();

  await mx.derivedIdentity().deriveFrom('Hello World');
  const derivedPublicKeyA = mx.derivedIdentity().publicKey;

  await mx.derivedIdentity().deriveFrom('Hello World');
  const derivedPubliKeyB = mx.derivedIdentity().publicKey;

  t.true(derivedPublicKeyA.equals(derivedPubliKeyB));
});

test('[derivedIdentity] it derives different addresses from different messages', async (t: Test) => {
  const mx = await init();

  await mx.derivedIdentity().deriveFrom('Hello World');
  const derivedPublicKeyA = mx.derivedIdentity().publicKey;

  await mx.derivedIdentity().deriveFrom('Hello Papito');
  const derivedPubliKeyB = mx.derivedIdentity().publicKey;

  t.false(derivedPublicKeyA.equals(derivedPubliKeyB));
});
