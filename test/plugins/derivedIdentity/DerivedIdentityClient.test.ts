import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { killStuckProcess, metaplex } from '../../helpers';
import {
  derivedIdentity,
  keypairIdentity,
  KeypairIdentityDriver,
} from '@/index';

killStuckProcess();

const init = async (message?: string) => {
  const mx = await metaplex();

  mx.use(derivedIdentity());

  if (message != null) {
    await mx.derivedIdentity().deriveFrom(message);
  }

  return mx;
};

test('[derivedIdentity] it derives a Keypair from the current identity', async (t: Test) => {
  // Given a Metaplex instance using the derived identity plugin.
  const mx = await init();

  // When we derive the identity using a message.
  await mx.derivedIdentity().deriveFrom('Hello World');

  // Then we get a Signer Keypair.
  t.true(mx.derivedIdentity().publicKey);
  t.true(mx.derivedIdentity().secretKey);

  // And it is different from the original identity.
  t.false(mx.derivedIdentity().equals(mx.identity()));
});

test('[derivedIdentity] it keeps track of the identity it originates from', async (t: Test) => {
  // Given a Metaplex instance using the derived identity plugin.
  const mx = await init();
  const identityPublicKey = mx.identity().publicKey;

  // When we derive the identity.
  await mx.derivedIdentity().deriveFrom('Hello World');

  // Then the derived identity kept track of the identity it originated from.
  t.true(identityPublicKey.equals(mx.derivedIdentity().originalPublicKey));

  // Even if we end up updating the identity.
  mx.use(keypairIdentity(Keypair.generate()));
  t.true(identityPublicKey.equals(mx.derivedIdentity().originalPublicKey));
  t.false(mx.identity().equals(mx.derivedIdentity().originalPublicKey));
});

test('[derivedIdentity] it can derive a Keypair from an explicit IdentitySigner', async (t: Test) => {
  // Given a Metaplex instance and a custom IdentitySigner.
  const mx = await init();
  const signer = new KeypairIdentityDriver(Keypair.generate());

  // When we derive the identity by providing the signer explicitly.
  await mx.derivedIdentity().deriveFrom('Hello World', signer);

  // Then a new derived identity was created for that signer.
  t.true(signer.publicKey.equals(mx.derivedIdentity().originalPublicKey));

  // But not for the current identity.
  t.false(mx.identity().equals(mx.derivedIdentity().originalPublicKey));
});

test('[derivedIdentity] it derives the same address when using the same message', async (t: Test) => {
  // Given a Metaplex instance using the derived identity plugin.
  const mx = await init();

  // When we derive the identity twice with the same message.
  await mx.derivedIdentity().deriveFrom('Hello World');
  const derivedPublicKeyA = mx.derivedIdentity().publicKey;

  await mx.derivedIdentity().deriveFrom('Hello World');
  const derivedPubliKeyB = mx.derivedIdentity().publicKey;

  // Then we get the same Keypair.
  t.true(derivedPublicKeyA.equals(derivedPubliKeyB));
});

test('[derivedIdentity] it derives different addresses from different messages', async (t: Test) => {
  // Given a Metaplex instance using the derived identity plugin.
  const mx = await init();

  // When we derive the identity twice with different messages.
  await mx.derivedIdentity().deriveFrom('Hello World');
  const derivedPublicKeyA = mx.derivedIdentity().publicKey;

  await mx.derivedIdentity().deriveFrom('Hello Papito');
  const derivedPubliKeyB = mx.derivedIdentity().publicKey;

  // Then we get the different Keypairs.
  t.false(derivedPublicKeyA.equals(derivedPubliKeyB));
});
